using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Text.Json;
using Semver;
using adaptiva.adabuild.FileSystem;

namespace adaptiva.adabuild.Config
{
	public class ConfigService
	{

		private static readonly string CONFIG_FILE =  @"\adabuild.config.json";

		public BuildConfiguration configuration;

		private FileSystemService fileSystemService;

		private Dictionary<string, ProjectDefinition> projectMap;

		public bool IsValid => configuration != default(BuildConfiguration);

		public ConfigService(FileSystemService _fileSystem)
		{
			fileSystemService = _fileSystem;
			projectMap = new Dictionary<string, ProjectDefinition>();
			LoadConfiguration();
		}

		public void LoadConfiguration()
		{
			try
			{
				configuration = fileSystemService.ReadFile<BuildConfiguration>(fileSystemService.Root + CONFIG_FILE);

				if (!String.IsNullOrEmpty(configuration.version)) {
					SemVersion _confVersion = SemVersion.Parse(configuration.version, SemVersionStyles.Any);
					SemVersion _currentVersion = SemVersion.Parse(Cli.VERSION, SemVersionStyles.Any);
					int _comparison = SemVersion.ComparePrecedence(_currentVersion, _confVersion);

					if (_comparison < 0)
					{
						throw new InvalidVersionException(configuration.version);
					}
				}

				foreach (ProjectDefinition _project in configuration.projectDefinitions)
					projectMap[_project.name] = _project;	
			}
			catch (InvalidVersionException e)
			{
				Logger.Error(e.Message);
				Environment.Exit(1);
			}
			catch (ArgumentNullException)
			{
				Logger.Error("Failed to load configuration file");
			}
			catch (JsonException)
			{
				Logger.Error("Failed to load configuration file");
			}
		}

		public async Task SaveConfiguration()
		{
			await fileSystemService.WriteFile(fileSystemService.Root + CONFIG_FILE,
				configuration.Export());
		}

		public ProjectDefinition GetProject(string _name)
		{
			if (projectMap.ContainsKey(_name))
				return projectMap[_name];

			return null;
		}

		public ProjectDefinition[] GetProjects()
		{
			return configuration.projectDefinitions;
		}

		public int GetConcurrencyLimit()
		{
			int _processorCount = Environment.ProcessorCount;
			return configuration.maxConcurrentBuilds == 0 ?
				_processorCount : Math.Min(configuration.maxConcurrentBuilds, _processorCount);
		}

		public void SetConcurrencyLimit(int _limit)
		{
			configuration.maxConcurrentBuilds = Math.Clamp(_limit, 0, Environment.ProcessorCount);
		}

		public async Task SaveConcurrencyLimit(int _limit)
		{
			SetConcurrencyLimit(_limit);
			await SaveConfiguration();
		}

		public async Task SetTerminal(string _terminal)
		{
			if (!Terminals.IsValid(_terminal))
			{
				Logger.Error($"Invalid terminal type: {_terminal}");
				return;
			}
			configuration.terminal = _terminal;
			await SaveConfiguration();
		}

		public class InvalidVersionException : Exception
		{
			public InvalidVersionException(string _expected) :
			base($"Invalid version v{Cli.VERSION}. Local configuration requires v{_expected} or later.")
			{

			}
		}

	}

}
