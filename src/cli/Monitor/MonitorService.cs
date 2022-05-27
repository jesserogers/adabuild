using System;
using System.Collections.Generic;
using System.IO;
using adabuild.FileSystem;
using adabuild.Config;

namespace adabuild.Monitor
{

	public class MonitorService
	{

		public MonitorState state;

		private FileSystemWatcher watcher;

		private FileSystemService fileSystemService;

		private ConfigService configService;

		public bool isRunning { get; private set; } = false;

		private Action SaveState;

		public MonitorService(
			FileSystemService _fileSystem,
			ConfigService _config,
			MonitorState _state
		)
		{
			fileSystemService = _fileSystem;
			configService = _config;
			state = _state;
			SaveState = Debouncer.Wrap(state.Save);
			if (configService.IsValid)
				DetectChanges();
		}

		public void Start()
		{
			if (isRunning)
				return;

			isRunning = true;
			Logger.Info("Starting Monitor Service...");
			Watch();
		}

		public void Stop()
		{
			DestroyWatcher();
			isRunning = false;
			Logger.Info("Stopped Monitor Service.");
		}

		public void Reset()
		{
			state.Clear();
			SaveState();
		}

		public void Reset(string _project)
		{
			state.Clear(_project);
			SaveState();
		}

		public void Reset(string[] _projects)
		{
			foreach (string _project in _projects)
				state.Clear(_project);

			SaveState();
		}

		private void DetectChanges()
		{
			foreach (ProjectDefinition _projectDefinition in configService.configuration.projectDefinitions)
			{
				IEnumerable<string> _projectDirectory = Directory.EnumerateFiles(
					$"{fileSystemService.Root}\\{configService.configuration.projectsFolder}\\{_projectDefinition.name}",
					$"*.{configService.configuration.fileExtension}",
					SearchOption.AllDirectories
				);

				if (!state.history.ContainsKey(_projectDefinition.name))
					continue;

				long _lastProjectBuildTime = state.history[_projectDefinition.name];

				foreach (string _file in _projectDirectory)
				{
					DateTime _lastUpdated = File.GetLastWriteTimeUtc(_file);
					if (((DateTimeOffset)_lastUpdated).ToUnixTimeMilliseconds() > state.history[_projectDefinition.name])
					{
						state.Change(_projectDefinition.name);
						break;
					}
				}
			}
		}

		private void Watch()
		{
			if (!configService.IsValid)
				return;

			string _path = $"{fileSystemService.Root}\\{configService.configuration.projectsFolder}";
			watcher = new FileSystemWatcher(_path, $"*.{configService.configuration.fileExtension}");

			watcher.NotifyFilter = NotifyFilters.DirectoryName
				| NotifyFilters.FileName
				| NotifyFilters.LastWrite;
			watcher.Changed += OnChanged;
			watcher.Created += OnCreated;
			watcher.Deleted += OnDeleted;
			watcher.Renamed += OnRenamed;
			watcher.IncludeSubdirectories = true;
			watcher.EnableRaisingEvents = true;
		}

		private void DestroyWatcher()
		{
			if (watcher == null)
				return;

			watcher.Changed -= OnChanged;
			watcher.Created -= OnCreated;
			watcher.Deleted -= OnDeleted;
			watcher.Renamed -= OnRenamed;
			watcher.Dispose();
		}

		private void OnChanged(object s, FileSystemEventArgs e)
		{
			if (e.ChangeType == WatcherChangeTypes.Changed)
				CheckPath(e.FullPath);
		}

		private void OnCreated(object s, FileSystemEventArgs e)
		{
			if (e.ChangeType == WatcherChangeTypes.Created)
				CheckPath(e.FullPath);
		}

		private void OnDeleted(object s, FileSystemEventArgs e)
		{
			if (e.ChangeType == WatcherChangeTypes.Deleted)
				CheckPath(e.FullPath);
		}

		private void OnRenamed(object s, FileSystemEventArgs e)
		{
			if (e.ChangeType == WatcherChangeTypes.Renamed)
				CheckPath(e.FullPath);
		}

		private void CheckPath(string _path)
		{
			foreach (ProjectDefinition _project in configService.configuration.projectDefinitions)
			{
				if (_path.Contains($"\\{_project.name}\\"))
				{
					state.Change(_project.name);
					SaveState();
					return;
				}
			}
		}

	}

}