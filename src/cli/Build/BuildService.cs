using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using adabuild.CommandLine;
using adabuild.Config;
using adabuild.Monitor;

namespace adabuild.Build
{
	public class BuildService
	{
		
		public static readonly int DEFAULT_PARALLEL_DELAY = 500;

		private MonitorService monitorService;

		private ConfigService configService;

		private CommandLineService commandLineService;

		private Queue<Queue<string>> buildQueue;

		private HashSet<string> buildManifest;

		public BuildService(
			MonitorService _monitorService,
			ConfigService _configService,
			CommandLineService _commandLineService
		) {
			monitorService = _monitorService;
			configService = _configService;
			commandLineService = _commandLineService;
			buildQueue = new Queue<Queue<string>>();
			buildManifest = new HashSet<string>();
		}

		public Task<int> Build(BuildRequest _buildRequest)
		{
			foreach (string _project in _buildRequest.projects)
			{
				ProjectDefinition _projectDefinition = configService.GetProject(_project);
				string _projectDirectory = ProjectDefinition.GetProjectDirectory(_projectDefinition);
				
				EnqueueDependencies(_projectDefinition.name, _buildRequest.incremental);

				if (_buildRequest.incremental && !monitorService.state.HasChanged(_projectDefinition.name))
				{
					Logger.Info($"No action: {_projectDefinition} and all dependencies up to date.");
					continue;
				}

				EnqueueProject(_projectDefinition.name);
			}

			if (buildManifest.Count == 0)
			{
				Logger.Info($"No action: All projects up to date.");
				return Task.FromResult<int>(0);
			}

			return ExecuteBuildQueue(_buildRequest);
		}

		public Task<int> BuildAll(BuildRequest _buildRequest)
		{
			Clear();

			foreach (ProjectDefinition _project in configService.GetProjects())
			{
				if (buildManifest.Contains(_project.name) || _project.type != "application")
					continue;
				
				EnqueueDependencies(_project.name, _buildRequest.incremental);

				if (_buildRequest.incremental && !monitorService.state.HasChanged(_project.name))
				{
					Logger.Info($"No action: {_project} and all dependencies up to date.");
					continue;
				}

				EnqueueProject(_project.name);
			}

			if (buildManifest.Count == 0)
			{
				Logger.Info($"No action: All projects up to date.");
				return Task.FromResult<int>(0);
			}

			return ExecuteBuildQueue(_buildRequest);
		}

		private void EnqueueBuildGroup(string _project)
		{
			EnqueueBuildGroup(new Queue<string>(new string[] { _project }));
		}

		private void EnqueueBuildGroup(Queue<string> _projects)
		{
			buildQueue.Enqueue(_projects);
		}

		private void EnqueueProject(string _project)
		{
			buildManifest.Add(_project);
			EnqueueBuildGroup(_project);
		}

		private void EnqueueDependencies(string _project, bool _incremental)
		{
			ProjectDefinition _projectDefinition = configService.GetProject(_project);

			if (_projectDefinition == null)
				throw new Exception($"No valid project definition for {_project}");

			Queue<string> _buildGroup = new Queue<string>();
			int _concurrencyLimit = configService.GetConcurrencyLimit();

			if (_projectDefinition.dependencies != null && _projectDefinition.dependencies.Length > 0)
			{

				foreach (string _dependency in _projectDefinition.dependencies)
				{
					if (buildManifest.Contains(_dependency))
						continue;

					ProjectDefinition _dependencyDefinition = configService.GetProject(_dependency);

					if (_dependencyDefinition == null)
						throw new Exception($"No valid project definition for {_dependency}");

					if (_dependencyDefinition.dependencies.Length > 0)
						EnqueueDependencies(_dependencyDefinition.name, _incremental);

					if (!CanBuildInParallel(_dependencyDefinition, _buildGroup)) {
						buildQueue.Enqueue(new Queue<string>(_buildGroup));
						_buildGroup.Clear();
					}

					if (_incremental)
					{
						if (!monitorService.state.HasChanged(_dependency))
						{
							Logger.Info($"No delta for {_dependency}. Skipping incremental build.");
							buildManifest.Add(_dependency);
							continue;
						}
						else
							monitorService.state.Change(_project);
					}

					_buildGroup.Enqueue(_dependency);
					buildManifest.Add(_dependency);
				}

				if (_buildGroup.Count > 0)
					EnqueueBuildGroup(_buildGroup);
			}
		}

		private async Task<int> ExecuteBuildQueue(BuildRequest _buildRequest)
		{
			int _exitCode = 0;
			
			if (buildQueue.Count < 1)
				return _exitCode;

			Benchmark _queueTimer = new Benchmark();

			if (!String.IsNullOrEmpty(configService.configuration.preBuild) && _buildRequest.prebuild)
			{
				Logger.Info($"Executing pre-build script: {configService.configuration.preBuild}");

				_exitCode = await commandLineService.Exec(configService.configuration.preBuild, _buildRequest.output);
				
				if (_exitCode != 0)
					return _exitCode;
			}

			await configService.CopyTsConfig("prod");

			Queue<string> _buildGroup;
			while (buildQueue.Count > 0)
			{
				_buildGroup = buildQueue.Dequeue();

				if (_buildGroup.Count == 0)
					continue;

				try
				{
					string[] _commands = _buildGroup.Select((string _name) =>
					{
						ProjectDefinition _project = configService.GetProject(_name);
						string _buildCommand;
						
						if (String.IsNullOrEmpty(_project.buildCommand))
							_buildCommand = $"ng build {_project.name}";
						else
							_buildCommand = _project.buildCommand;

						if (_buildCommand.StartsWith("npm run"))
								_buildCommand += " --";
						
						return (_buildRequest.projects.Contains(_project.name)) ?
							_buildCommand + " " + _buildRequest.arguments :
							_buildCommand;

					}).ToArray();

					string _groupName = String.Join(", ", _buildGroup);
					Benchmark _groupTimer = new Benchmark();
					
					Logger.Info($"Executing build for {_groupName}...");
					
					if (_buildGroup.Count == 1)
						_exitCode = await commandLineService.Exec(_commands[0], _buildRequest.output, 0);
					else if (_buildGroup.Count > 1)
						_exitCode = await commandLineService.Exec(_commands, _buildRequest.output, _buildRequest.delay);
					else
						continue;

					if (_exitCode != 0)
					{
						Clear();
						Logger.Error($"Failed build for {_groupName} in {_groupTimer.Elapsed()}");
						
						await ExecuteBuildFailureScript(_buildRequest.output);

						return _exitCode;
					}

					Logger.Info($"Completed build for {_groupName} in {_groupTimer.Elapsed()}");
					monitorService.state.Record(_buildGroup.ToArray());
					await monitorService.state.Save();
					
				}
				catch (Exception e)
				{
					Logger.Error(e.Message);
					Clear();
					
					await ExecuteBuildFailureScript(_buildRequest.output);
					
					_exitCode = 1;
					return _exitCode;
				}
			}

			if (!String.IsNullOrEmpty(configService.configuration.postBuild) && _buildRequest.postbuild)
			{
				Logger.Info($"Executing post-build script: {configService.configuration.postBuild}");
				_exitCode = await commandLineService.Exec(configService.configuration.postBuild, _buildRequest.output);
			}

			Logger.Info($"SUCCESS: Completed build queue in {_queueTimer.Elapsed()}.");
			Clear();
			return _exitCode;
		}

		private async Task ExecuteBuildFailureScript(bool _output)
		{
			if (!String.IsNullOrEmpty(configService.configuration.onError))
				await commandLineService.Exec(configService.configuration.onError, _output);
		}

		private void Clear()
		{
			buildQueue.Clear();
			buildManifest.Clear();
		}

		private bool CanBuildInParallel(ProjectDefinition _next, Queue<string> _buildGroup)
		{
			if (_next.dependencies.Length == 0 || _buildGroup.Count == 0)
				return true;

			if (_buildGroup.Count >= configService.GetConcurrencyLimit())
				return false;

			foreach (string _dependency in _next.dependencies)
				if (_buildGroup.Contains(_dependency))
					return false;

			return true;
		}

	}
}
