using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace adabuild.Build
{
	public class Service
	{

		private Monitor.Service MonitorService;

		private Config.Service ConfigService;

		private CommandLine.Service CommandLineService;

		private Queue<HashSet<string>> BuildQueue = new Queue<HashSet<string>>();

		private HashSet<string> BuildManifest = new HashSet<string>();

		public Service(
			ref Monitor.Service _monitorService,
			ref Config.Service _configService,
			ref CommandLine.Service _commandLineService
		) {
			MonitorService = _monitorService;
			ConfigService = _configService;
			CommandLineService = _commandLineService;
		}

		public Task<int> Build(string _project, bool _incremental = true)
		{
			EnqueueDependencies(_project, _incremental);

			if (_incremental && !MonitorService.State.HasChanged(_project))
			{
				Console.WriteLine($"No action: {_project} and all dependencies up to date.");
				return Task.FromResult<int>(0);
			}

			Enqueue(_project);
			return ExecuteBuildQueue();
		}

		private void Enqueue(string _project)
		{
			Enqueue(new HashSet<string> { _project });
		}

		private void Enqueue(HashSet<string> _projects)
		{
			Console.WriteLine($"Queueing {String.Join(", ", _projects)}...");
			BuildQueue.Enqueue(_projects);
		}

		private void EnqueueDependencies(string _project, bool _incremental)
		{
			Config.ProjectDefinition _projectDefinition = ConfigService.GetProject(_project);

			if (_projectDefinition == null)
				return; // @todo: throw exception?

			HashSet<string> _buildGroup = new HashSet<string>();

			if (_projectDefinition.dependencies != null && _projectDefinition.dependencies.Length > 0)
			{

				Config.ProjectDefinition _buildGroupHead = default(Config.ProjectDefinition);

				foreach (string _dependency in _projectDefinition.dependencies)
				{
					if (BuildManifest.Contains(_dependency))
						continue;

					Config.ProjectDefinition _dependencyDefinition = ConfigService.GetProject(_dependency);

					if (_dependencyDefinition == null)
						throw new Exception($"Invalid dependency definition for {_dependency}");

					byte _concurrencyLimit = ConfigService.GetConcurrencyLimit();

					if (
						_buildGroup.Count > 0 &&
						(_concurrencyLimit > 0 && _buildGroup.Count >= _concurrencyLimit) ||
						!CanBuildInParallel(_dependencyDefinition, _buildGroupHead)
					) {
						BuildQueue.Enqueue(new HashSet<string>(_buildGroup));
						_buildGroup.Clear();
						_buildGroupHead = _dependencyDefinition;
					}
					else if (_buildGroupHead == null)
					{
						_buildGroupHead = _dependencyDefinition;
					}

					if (_incremental)
					{
						if (!MonitorService.State.HasChanged(_dependency))
						{
							Console.WriteLine($"No delta for {_dependency}. Skipping incremental build.");
							continue;
						}
						else
							MonitorService.State.Change(_project);
					}

					_buildGroup.Add(_dependency);
					BuildManifest.Add(_dependency);
				}

				if (_buildGroup.Count > 0)
					Enqueue(_buildGroup);
			}
		}

		private async Task<int> ExecuteBuildQueue()
		{
			if (BuildQueue.Count < 1)
				return 0;

			foreach (HashSet<string> _buildGroup in BuildQueue)
			{
				if (_buildGroup.Count == 0)
					continue;

				try
				{
					string[] _commands = _buildGroup.Select(_name =>
					{
						Config.ProjectDefinition _project = ConfigService.GetProject(_name);
						return _project.buildCommand != null ?
							_project.buildCommand : $"ng build {_project.name} --configuration production";
					}).ToArray();

					int _exitCode;
					
					Console.WriteLine($"Executing build for {String.Join(", ", _buildGroup)}...");
					
					if (_buildGroup.Count == 1)
						_exitCode = await CommandLineService.Exec(_commands[0]);
					else if (_buildGroup.Count > 1)
						_exitCode = await CommandLineService.Exec(_commands);
					else
						continue;

					if (_exitCode != 0)
						return _exitCode;

					Console.WriteLine($"Completed build for {String.Join(", ", _buildGroup)}.");
					MonitorService.State.Record(_buildGroup.ToArray());
					await MonitorService.State.Save();
					
				}
				catch
				{
					return 1;
				}
			}

			Console.WriteLine($"SUCCESS: Completed build queue.");
			return 0;
		}

		private void Clear()
		{
			BuildQueue.Clear();
			BuildManifest.Clear();
		}

		private bool CanBuildInParallel(Config.ProjectDefinition _next, Config.ProjectDefinition _head)
		{
			if (_next == null || _head == null)
				return false;

			if (_next.dependencies.Length == 0)
				return true;

			foreach (string _dependency in _next.dependencies)
				if (Array.IndexOf(_head.dependencies, _dependency) == -1)
					return false;

			return true;
		}

	}
}
