import { BaseCommandLineService, CliCommand, CommandLineTask } from "../cmd";
import { BaseConfigurationService, IProjectDefinition } from "../config";
import { BaseFileSystemService } from "../filesystem";
import { BaseLoggingService } from "../logging";
import { BaseMonitorService } from "../monitor";
import { Benchmark } from "../utils";

type BuildQueue = string[][];

/**
 * @author Jesse Rogers <jesse.rogers@adaptiva.com>
 * @description Manages Angular (and other) build processes in order of dependency.
 * 	Attempts to parallelize builds when possible.
 * @see BaseCommandLineService
 */
export abstract class BaseBuildService {

	protected _buildQueue: BuildQueue = [];

	protected _requestedBuild: string = "";

	private _buildManifest: Set<string> = new Set();

	constructor(
		protected monitor: BaseMonitorService,
		protected cmd: BaseCommandLineService,
		protected logging: BaseLoggingService,
		protected fileSystem: BaseFileSystemService,
		protected config: BaseConfigurationService
	) {

	}

	/** Requests a project name to build */
	public build(incremental: boolean = false): Promise<number> {
		this._clear();
		return this._requestProjectName().then(_project =>
			this.buildProject(_project, incremental)
		).catch(_err => {
			this.logging.log("BaseBuildService.build", _err);
			return _err;
		});
	}

	/** Builds a project (and its dependencies) by name */
	public buildProject(project: string, incremental: boolean = false): Promise<number> {
		if (!project)
			return Promise.resolve(-1);

		if (!this.config.getProject(project)) {
			this.logging.error("BaseBuildService.buildProject", "Invalid project name \"" + project + "\"");
			return Promise.reject("Invalid project name: " + project);
		}

		this._clear();

		return this.config.copyTsConfigProd().then(() =>
			this._enqueueBuild(project, incremental)
		);
	}

	/** * Checks notes * Builds all projects? */
	public buildAllProjects(): Promise<number> {
		this._clear();
		this.config.buildConfig.projectDefinitions.forEach(_project => {
			this._enqueueBuild(_project.name, true);
		});
		this.logging.log("BaseBuildService.buildAllProjects", "Building all projects...");
		return this._executeBuildQueue().then(_code => {
			this.monitor.reset();
			return _code;
		});
	}

	/** Runs an application in debug mode. Defaults to `ng serve` */
	public debug(): void {
		this._requestProjectName().then(_app => this.debugProject(_app));
	}

	public debugProject(project: string): Promise<number> {
		const _project: IProjectDefinition | undefined = this.config.getProject(project);
		if (_project?.type !== "application") {
			const _errorMessage: string = "Cannot debug project type " + _project?.type;
			this.logging.error("BaseBuildService.debugProject", );
			return Promise.reject(_errorMessage);
		}
		return this.config.copyTsConfigDev().then(() => new Promise((resolve, reject) => {
			this.cmd.exec({
				command: _project?.debugCommand || `ng serve ${project}`,
				directory: this.fileSystem.root,
				args: [],
				output: true,
				onOutput: (output: string) => {
					if (output.includes("Compiled successfully."))
						resolve(0);
				}
			}).catch(_err => {
				reject(_err);
			});
		}));
	}

	private async _enqueueBuild(project: string, incremental = false): Promise<number> {
		this._enqueueDependencies(project, incremental);

		if (incremental && !this.monitor.state.hasChanged(project)) {
			this.logging.log("BaseBuildService._enqueueBuild", `No action: ${project} and all dependencies up to date`);
			return Promise.resolve(0);
		}

		this._enqueue([project]);
		this.logging.log("BaseBuildService._enqueueBuild", `Running ${incremental ? "incremental" : "full"} build for ${project}...`);
		return this._executeBuildQueue();
	}

	private _enqueue(projects: string[]): void {
		this.logging.log("BaseBuildService._enqueue", "Queueing " + projects.join(", ") + " for build...");
		this._buildQueue.push(projects);
	}

	private _enqueueDependencies(project: string, incremental = false): void {
		const _project: IProjectDefinition | undefined = this.config.getProject(project);
		const _queue: Set<string> = new Set();

		if (!_project)
			throw new Error("Invalid project: " + project);

		if (_project.dependencies && _project.dependencies.length) {

			let _buildGroupHead: IProjectDefinition | undefined;

			for (let i = 0; i < _project.dependencies.length; i++) {

				const _dependency: string = _project.dependencies[i];
				// skip if any previous build queues include dependency
				if (this._buildManifest.has(_dependency))
					continue;

				const _dependencyDefinition: IProjectDefinition | undefined = this.config.getProject(_dependency);

				if (!_dependencyDefinition) {
					this.logging.error("BaseBuildService._enqueueDependencies", `Invalid dependency listed for ${project}: ${_dependency}.`);
					throw new Error("Invalid dependency: " + _dependency);
				}

				const _concurrencyLimit: number = this.config.getConcurrencyLimit();

				// check if dependency can be run in parallel
				if (
					_queue.size &&
					(
						// concurrency limit met
						(_concurrencyLimit && _queue.size >= _concurrencyLimit) ||
						// or differing dependencies
						!this._hasIdenticalDependencies(_dependencyDefinition, _buildGroupHead)
					)
				) {
					// can't run in parallel, so dump current queue into a build group
					// and run it back
					// @todo: handle carryover if concurrency limit exceeded
					this._enqueue([..._queue]);
					_queue.clear();
					_buildGroupHead = _dependencyDefinition;
				} else if (!_buildGroupHead) {
					_buildGroupHead = _dependencyDefinition;
				}

				if (incremental) {
					// no changes, don't build
					if (!this.monitor.state.hasChanged(_dependency)) {
						this.logging.log("BaseBuildService._enqueueDependencies", `No delta for ${_dependency}. Skipping incremental build...`);
						continue;
					} else {
						// dependencies changed; mark depending project as changed to ensure build runs
						this.monitor.state.change(project);
					}
				}

				_queue.add(_dependency);
				this._buildManifest.add(_dependency);
			}

			if (_queue.size)
				this._enqueue([..._queue]);
		}
	}

	private async _executeBuildQueue(): Promise<number> {

		const _method: string = "BaseBuildService._executeBuildQueue";

		if (!this._buildQueue.length) {
			this.logging.info(_method, "Build queue is empty -- all projects are up to date.");
			return Promise.resolve(0);
		}

		const _buildGroups: CommandLineTask[][] = this._buildQueue.map(_queue =>
			this._generateTasksForProjects(_queue)
		);

		const _benchmark = new Benchmark();

		for (let i = 0; i < _buildGroups.length; i++) {

			const _group: CommandLineTask[] = _buildGroups[i];
			const _projects: string[] = this._buildQueue[i];

			try {
				if (_group.length === 1)
					this.logging.log(_method, `Executing build for ${_projects[0]}...`);
				else if (_group.length > 1)
					this.logging.log(_method, `Executing build for ${_projects.join(", ")}...`);
				else
					continue;

				const _groupBenchmark = new Benchmark();

				// execute builds in parallel
				// @todo: only use the parallel method more than one project in group
				const _exitCode: number = await this.cmd.execParallel(..._group).then(_code => {
					this.monitor.state.record(..._projects);
					return _code;
				}).catch(_err => {
					this.logging.error(_method, `Build Failed with code ${_err} in ${_benchmark.toString()}.`);
					return _err;
				});

				if (_exitCode > 0)
					return Promise.reject(_exitCode);

				_group.length > 1
					? this.logging.log(_method, `Completed build for ${_projects.join(", ")} in ${_groupBenchmark.toString()}.`)
					: this.logging.log(_method, `Completed build for ${_projects[0]} in ${_groupBenchmark.toString()}.`);

			} catch (_err) {
				return Promise.reject(_err);
			}
		}

		this.logging.info(_method, `SUCCESS: Completed build queue in ${_benchmark.toString()}`);
		return Promise.resolve(0);
	}

	private _generateTasksForProjects(_projects: string[]): CommandLineTask[] {
		return _projects.reduce((_accumulator: CommandLineTask[], _project: string) => {
			const _definition: IProjectDefinition | undefined = this.config.getProject(_project);
			if (!_definition)
				throw new Error("Invalid project: " + _project);

			_accumulator.push(new CommandLineTask({
				command: _definition.buildCommand || `ng build ${_project} --c production`,
				args: [],
				delay: 500, // give ngcc some time to figure itself out
				directory: this.fileSystem.root
			}));

			return _accumulator;
		}, []);
	}

	private _hasIdenticalDependencies(_next?: IProjectDefinition, _previous?: IProjectDefinition): boolean {
		if (!_next || !_previous)
			return false;

		// if next project has *no* dependencies, consider it to be identical
		if (!_next.dependencies.length)
			return true;

		return _next.dependencies.every(_dependency => _previous.dependencies.includes(_dependency));
	}

	private _clear(): void {
		this._buildQueue = [];
		this._buildManifest.clear();
	}

	abstract _requestProjectName(): Promise<string>;

}