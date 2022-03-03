import { BaseCommandLineService, CliCommand, CommandLineTask } from "../cmd";
import { BaseConfigurationService, IProjectDefinition } from "../config";
import { BaseFileSystemService } from "../filesystem";
import { BaseLoggingService } from "../logging";
import { BaseMonitorService } from "../monitor";

type BuildQueue = string[][];

export interface BaseBuildService {
	build(incremental: boolean): void;
	buildAllProjects(): void;
	debugApplication(): void;
}

export abstract class BaseBuildService implements BaseBuildService {

	protected _buildQueue: BuildQueue = [];

	protected _requestedBuild: string = "";

	constructor(
		protected monitor: BaseMonitorService,
		protected cmd: BaseCommandLineService,
		protected logging: BaseLoggingService,
		protected fileSystem: BaseFileSystemService,
		protected config: BaseConfigurationService
	) {

	}

	public build(incremental: boolean = false): Promise<number> {
		return this._requestProjectName().then(_project => 
			this.buildProject(_project, incremental)
		).catch(_err => {
			this.logging.log("BaseBuildService.build", _err);
			return _err;
		});
	}

	public buildProject(project: string, incremental: boolean = false): Promise<number> {
		if (!project)
			return Promise.resolve(-1);

		if (!this.config.getProject(project)) {
			this.logging.error("BaseBuildService.buildProject", "Invalid project name \"" + project + "\"")
			return Promise.reject("Invalid project name: " + project);
		}

		return this.config.copyTsConfigProd().then(() =>
			this._enqueueBuild(project, incremental)
		);
	}

	public buildAllProjects(): Promise<number> {
		this._buildQueue = [];
		this.config.buildConfig.projectDefinitions.forEach(_project => {
			this._enqueueBuild(_project.name, true);
		});
		this.logging.log("BaseBuildService.buildAllProjects", "Building all projects...");
		return this._executeBuildQueue().then(_code => {
			this.monitor.reset();
			return _code;
		});
	}

	public debugApplication(): void {
		this._requestProjectName().then(_app => {
			const _project: IProjectDefinition | undefined = this.config.getProject(_app);
			if (_project?.type !== "application") {
				this.logging.error("BaseBuildService.debugApplication", "Cannot debug project type " + _project?.type);
				return;
			}
			this.config.copyTsConfigDev().then(() => {
				this.cmd.exec({
					command: _project?.debugCommand || `ng serve ${_app}`,
					directory: this.fileSystem.root,
					args: []
				});
			});
		});
	}

	private async _enqueueBuild(project: string, incremental = false): Promise<number> {
		this._enqueueDependencies(project, incremental);

		if (incremental && !this.monitor.state.hasChanged(project)) {
			this.logging.log("BaseBuildService._enqueueBuild", `No delta for ${project}: skipping incremental build.`);
			return Promise.resolve(0);
		}

		this._enqueue(project);
		this.logging.log("BaseBuildService._enqueueBuild", `Running ${incremental ? "incremental" : "full"} build for ${project}...`);
		return this._executeBuildQueue();
	}

	abstract _requestProjectName(): Promise<string>;

	private _enqueue(...projects: string[]): void {
		this.logging.log("BaseBuildService._enqueue", "Queueing " + projects.join(", ") + " for build...");
		this._buildQueue.push(projects);
	}

	private _enqueueDependencies(project: string, incremental = false): void {
		const _project: IProjectDefinition | undefined = this.config.getProject(project);
		const _queue: Set<string> = new Set();
		const _flattenedQueue: Set<string> = new Set();

		if (!_project)
			throw new Error("Invalid project: " + project);

		if (_project.dependencies && _project.dependencies.length) {
			
			let _lastDependencyDefinition: IProjectDefinition | undefined;

			for (let i = 0; i < _project.dependencies.length; i++) {

				const _dependency: string = _project.dependencies[i];
				// skip if any previous build queues include dependency
				if (_flattenedQueue.has(_dependency))
					continue;

				const _dependencyDefinition: IProjectDefinition | undefined = this.config.getProject(_dependency);

				if (!_dependencyDefinition) {
					this.logging.error("BaseBuildService._enqueueDependencies", `Invalid dependency listed for ${project}: ${_dependency}.`);
					throw new Error("Invalid dependency: " + _dependency);
				}

				// check if dependency can be run in parallel
				if (_queue.size && !this._hasIdenticalDependencies(_dependencyDefinition, _lastDependencyDefinition)) {
					this._enqueue(...Array.from(_queue).filter(p => !_flattenedQueue.has(p)));
					_queue.clear();
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
				
				_lastDependencyDefinition = _dependencyDefinition;
				_queue.add(_dependency);
				_flattenedQueue.add(_dependency);
			}
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

				// execut builds in parallel
				const _exitCode: number = await this.cmd.execParallel(..._group).catch(_err => {
					throw new Error(_err);
				});

				if (_exitCode > 0)
					return Promise.reject(_exitCode);

				_group.length > 1
					? this.logging.log(_method, `Executing build for ${_projects.join(", ")}.`)
					: this.logging.log(_method, `Completed build for ${_projects[0]}.`);
				
				this.monitor.state.record(_projects[i]);
			} catch (_err) {
				return Promise.reject(_err);
			}
		}

		this._buildQueue = [];
		return Promise.resolve(0);
	}

	private _generateTasksForProjects(_projects: string[]): CommandLineTask[] {
		return _projects.reduce((_accumulator: CommandLineTask[], _project: string) => {
			const _definition: IProjectDefinition | undefined = this.config.getProject(_project);
			if (!_definition)
				throw new Error("Invalid project: " + _project);
				
			const [command, ...args]: CliCommand = this.cmd.parseCommand(
				_definition.buildCommand || `ng build ${_project} --c production`
			);
			_accumulator.push(new CommandLineTask({ command,  args, directory: this.fileSystem.root }));
			
			return _accumulator;
		}, []);
	}

	private _hasIdenticalDependencies(_next?: IProjectDefinition, _previous?: IProjectDefinition): boolean {
		if (!_next || !_previous)
			return false;

		// if next project has *no* dependencies, consider it to be identical
		if (!_next.dependencies.length)
			return true;
		
		return _next.dependencies.length === _previous.dependencies.length &&
			_next.dependencies.every(_dependency => _previous.dependencies.includes(_dependency));
	}

}