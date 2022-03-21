﻿using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace adabuild.Build
{
	public class Service
	{

		private static int PARALLEL_BUILD_DELAY = 500;

		private Monitor.Service monitorService;

		private Config.Service configService;

		private CommandLine.Service commandLineService;

		private Queue<HashSet<string>> buildQueue;

		private HashSet<string> buildManifest;

		public Service(
			ref Monitor.Service _monitorService,
			ref Config.Service _configService,
			ref CommandLine.Service _commandLineService
		) {
			monitorService = _monitorService;
			configService = _configService;
			commandLineService = _commandLineService;
			buildQueue = new Queue<HashSet<string>>();
			buildManifest = new HashSet<string>();
		}

		public Task<int> Build(string _project, bool _incremental = true)
		{
			Clear();
			EnqueueDependencies(_project, _incremental);

			if (_incremental && !monitorService.state.HasChanged(_project))
			{
				Logger.Info($"No action: {_project} and all dependencies up to date.");
				return Task.FromResult<int>(0);
			}

			Enqueue(_project);
			return ExecuteBuildQueue();
		}

		public Task<int> BuildAll(bool _incremental = true)
		{
			Clear();
			foreach (Config.ProjectDefinition _project in configService.configuration.projectDefinitions)
			{
				EnqueueDependencies(_project.name, _incremental);

				if (_incremental && !monitorService.state.HasChanged(_project.name))
				{
					Logger.Info($"No action: {_project} and all dependencies up to date.");
					continue;
				}

				Enqueue(_project.name);
			}

			if (buildQueue.Count == 0)
			{
				Logger.Info($"No action: All projects up to date.");
				return Task.FromResult<int>(0);
			}

			return ExecuteBuildQueue();
		}

		private void Enqueue(string _project)
		{
			Enqueue(new HashSet<string> { _project });
		}

		private void Enqueue(HashSet<string> _projects)
		{
			buildQueue.Enqueue(_projects);
		}

		private void EnqueueDependencies(string _project, bool _incremental)
		{
			Config.ProjectDefinition _projectDefinition = configService.GetProject(_project);

			if (_projectDefinition == null)
				throw new Exception($"No valid project definition for {_project}");

			HashSet<string> _buildGroup = new HashSet<string>();
			int _concurrencyLimit = configService.GetConcurrencyLimit();

			if (_projectDefinition.dependencies != null && _projectDefinition.dependencies.Length > 0)
			{

				foreach (string _dependency in _projectDefinition.dependencies)
				{
					if (buildManifest.Contains(_dependency))
						continue;

					Config.ProjectDefinition _dependencyDefinition = configService.GetProject(_dependency);

					if (_dependencyDefinition == null)
						throw new Exception($"No valid project definition for {_dependency}");

					if (
						_buildGroup.Count > 0 &&
						(_concurrencyLimit > 0 && _buildGroup.Count >= _concurrencyLimit) ||
						!CanBuildInParallel(_dependencyDefinition, _buildGroup)
					) {
						buildQueue.Enqueue(new HashSet<string>(_buildGroup));
						_buildGroup.Clear();
					}

					if (_incremental)
					{
						if (!monitorService.state.HasChanged(_dependency))
						{
							Logger.Info($"No delta for {_dependency}. Skipping incremental build.");
							continue;
						}
						else
							monitorService.state.Change(_project);
					}

					_buildGroup.Add(_dependency);
					buildManifest.Add(_dependency);
				}

				if (_buildGroup.Count > 0)
					Enqueue(_buildGroup);
			}
		}

		private async Task<int> ExecuteBuildQueue()
		{
			if (buildQueue.Count < 1)
				return 0;

			Utilities.Benchmark _queueTimer = new Utilities.Benchmark();

			await configService.CopyTsConfig("prod");

			HashSet<string> _buildGroup;
			while (buildQueue.Count > 0)
			{
				_buildGroup = buildQueue.Dequeue();

				if (_buildGroup.Count == 0)
					continue;

				try
				{
					string[] _commands = _buildGroup.Select((string _name) =>
					{
						Config.ProjectDefinition _project = configService.GetProject(_name);
						return _project.buildCommand != null ?
							_project.buildCommand : $"ng build {_project.name} --configuration production";
					}).ToArray();

					int _exitCode = 0;
					string _groupName = String.Join(", ", _buildGroup);
					Utilities.Benchmark _groupTimer = new Utilities.Benchmark();
					
					Logger.Info($"Executing build for {_groupName}...");
					
					if (_buildGroup.Count == 1)
						_exitCode = await commandLineService.Exec(_commands[0]);
					else if (_buildGroup.Count > 1)
						_exitCode = await commandLineService.Exec(_commands, PARALLEL_BUILD_DELAY);
					else
						continue;

					if (_exitCode != 0)
					{
						Clear();
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
					return 1;
				}
			}

			Logger.Info($"SUCCESS: Completed build queue in {_queueTimer.Elapsed()}.");
			Clear();
			return 0;
		}

		private void Clear()
		{
			buildQueue.Clear();
			buildManifest.Clear();
		}

		private bool CanBuildInParallel(Config.ProjectDefinition _next, HashSet<string> _buildGroup)
		{
			if (_next == null || _buildGroup == null)
				return false;

			if (_next.dependencies.Length == 0 || _buildGroup.Count == 0)
				return true;

			foreach (string _dependency in _next.dependencies)
				if (_buildGroup.Contains(_dependency))
					return false;

			return true;
		}

	}
}
