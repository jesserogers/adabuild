using System;
using System.IO;

namespace adabuild.Monitor
{

	public class Service
	{

		public State State;

		private FileSystemWatcher Watcher;

		private FileSystem.Service FileSystemService;

		private Config.Service ConfigService;

		private Action SaveState;

		public Service(
			ref FileSystem.Service _fileSystem,
			ref Config.Service _config,
			ref State _state
		)
		{
			FileSystemService = _fileSystem;
			ConfigService = _config;
			State = _state;
		}

		public void Start()
		{
			Console.WriteLine("Starting Monitor Service...");
			SaveState = Utilities.Debouncer.Wrap(State.Save);
			Watch();
		}

		public void Reset()
		{
			State.Clear();
			SaveState();
		}

		public void Reset(string _project)
		{
			State.Clear(_project);
			SaveState();
		}

		public void Reset(string[] _projects)
		{
			foreach (string _project in _projects)
				State.Clear(_project);

			SaveState();
		}

		private void Watch()
		{
			string _path = $"{FileSystemService.Root}\\{ConfigService.Configuration.projectsRootGlob}";
			Watcher = new FileSystemWatcher(_path);

			Watcher.NotifyFilter = NotifyFilters.DirectoryName
				| NotifyFilters.FileName
				| NotifyFilters.LastWrite;
			Watcher.Changed += OnChanged;
			Watcher.Created += OnCreated;
			Watcher.Deleted += OnDeleted;
			Watcher.Renamed += OnRenamed;
			Watcher.IncludeSubdirectories = true;
			Watcher.EnableRaisingEvents = true;
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
			foreach (Config.ProjectDefinition _project in ConfigService.Configuration.projectDefinitions)
			{
				if (_path.Contains($"{ConfigService.Configuration.projectsRootGlob}\\{_project.name}\\"))
				{
					State.Change(_project.name);
					SaveState();
					return;
				}
			}
		}

	}

}