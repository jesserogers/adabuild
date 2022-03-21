using System;
using System.IO;

namespace adabuild.Monitor
{

	public class Service
	{

		public State state;

		private FileSystemWatcher watcher;

		private FileSystem.Service fileSystemService;

		private Config.Service configService;

		private bool isRunning = false;

		private Action SaveState;

		public Service(
			FileSystem.Service _fileSystem,
			Config.Service _config,
			State _state
		)
		{
			fileSystemService = _fileSystem;
			configService = _config;
			state = _state;
			SaveState = Utilities.Debouncer.Wrap(state.Save);
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

		private void Watch()
		{
			string _path = $"{fileSystemService.Root}\\{configService.configuration.projectsFolder}";
			watcher = new FileSystemWatcher(_path);

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
			watcher.Changed -= OnChanged;
			watcher.Created -= OnCreated;
			watcher.Deleted -= OnDeleted;
			watcher.Renamed -= OnRenamed;
			watcher.Dispose();
		}

		private void OnChanged(object s, FileSystemEventArgs e)
		{
			if (e.ChangeType == WatcherChangeTypes.Changed)
				CheckChanges(e.FullPath);
		}

		private void OnCreated(object s, FileSystemEventArgs e)
		{
			if (e.ChangeType == WatcherChangeTypes.Created)
				CheckChanges(e.FullPath);
		}

		private void OnDeleted(object s, FileSystemEventArgs e)
		{
			if (e.ChangeType == WatcherChangeTypes.Deleted)
				CheckChanges(e.FullPath);
		}

		private void OnRenamed(object s, FileSystemEventArgs e)
		{
			if (e.ChangeType == WatcherChangeTypes.Renamed)
				CheckChanges(e.FullPath);
		}

		private void CheckChanges(string _path)
		{
			foreach (Config.ProjectDefinition _project in configService.configuration.projectDefinitions)
			{
				if (_path.Contains($"{configService.configuration.projectsFolder}\\{_project.name}\\"))
				{
					state.Change(_project.name);
					SaveState();
					return;
				}
			}
		}

	}

}