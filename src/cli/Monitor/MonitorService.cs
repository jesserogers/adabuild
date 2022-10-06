using System;
using System.Collections.Generic;
using System.IO;
using adaptiva.adabuild.FileSystem;
using adaptiva.adabuild.Config;

namespace adaptiva.adabuild.Monitor
{

	public class MonitorService
	{

		public MonitorState state;

		private FileSystemWatcher watcher;

		private FileSystemService fileSystemService;

		private ConfigService configService;

		public bool isRunning { get; private set; } = false;

		private Action SaveState;

		private Dictionary<string, HashSet<string>> directoryToProjectNameMapping;

		private string RootPath => $"{fileSystemService.Root}\\{configService.configuration.projectsFolder}";

		private string ProjectFilePattern => $"*.{configService.configuration.fileExtension}";

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
			directoryToProjectNameMapping = new Dictionary<string, HashSet<string>>();

			if (configService.IsValid)
			{
				InitRedirectMapping();
				DetectChanges();
			}
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

		private void InitRedirectMapping()
		{
			foreach (ProjectDefinition _project in configService.GetProjects())
			{
				string _path = ProjectDefinition.GetProjectDirectory(_project);

				if (directoryToProjectNameMapping.ContainsKey(_path))
					directoryToProjectNameMapping[_path].Add(_project.name);
				else
					directoryToProjectNameMapping.Add(_path, new HashSet<string>(new string[1] {_project.name}));
			}
		}

		private void DetectChanges()
		{
			foreach (ProjectDefinition _projectDefinition in configService.configuration.projectDefinitions)
			{
				try
				{

					string _projectDirectoryName = ProjectDefinition.GetProjectDirectory(_projectDefinition);
					string _projectPath = $"{RootPath}\\{_projectDirectoryName}";

					IEnumerable<string> _projectDirectory = Directory.EnumerateFiles(
						_projectPath, ProjectFilePattern, SearchOption.AllDirectories
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
				catch (DirectoryNotFoundException)
				{
					Logger.Error($"[MonitorService.DetectChanges] \"{_projectDefinition.name}\" directory not found");
					continue;
				}
			}
		}

		private void Watch()
		{
			if (!configService.IsValid)
				return;

			watcher = new FileSystemWatcher(RootPath, ProjectFilePattern);

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
			foreach (ProjectDefinition _projectDef in configService.GetProjects())
			{
				string _directory = ProjectDefinition.GetProjectDirectory(_projectDef);

				if (_path.Contains($"\\{_directory}\\"))
				{
					HashSet<string> _projects = directoryToProjectNameMapping[_directory];

					foreach (string _project in _projects)
					{
						state.Change(_project);
						SaveState();
					}
				}
			}

			
		}

	}

}