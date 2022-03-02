import { BaseCommandLineService } from "../cmd";
import { BaseConfigurationService, IProjectDefinition } from "../config";
import { BaseFileSystemService } from "../filesystem";
import { BaseLoggingService } from "../logging";
import { BaseMonitorService } from "../monitor";

export interface BaseBuildService {
	build(incremental: boolean): void;
	buildAllProjects(): void;
	debugApplication(): void;
}

export abstract class BaseBuildService implements BaseBuildService {

	protected _buildQueue = new Set<string>();

	protected _requestedBuild: string = "";

	constructor(
		protected monitor: BaseMonitorService,
		protected cmd: BaseCommandLineService,
		protected logging: BaseLoggingService,
		protected fileSystem: BaseFileSystemService,
		protected config: BaseConfigurationService
	) {

	}

	public build(incremental: boolean = false): void {
		this._requestProjectName().then(_project => {
			if (!this.config.getProject(_project))
				return this.logging.error("Invalid project name \"" + _project + "\"");

			return this.config.copyTsConfigProd().then(() => {
				this._enqueueBuild(_project, incremental);
			});
		}).catch(() => {
			this.logging.log("Invalid project name input");
		});
	}

	public buildAllProjects(): void {
		this._buildQueue.clear();
		this.config.buildConfig.projectDefinitions.forEach(_project => {
			this._enqueueBuild(_project.name, true);
		});
		this.logging.log("Building all projects...");
		this._executeBuildQueue();
	}

	public debugApplication(): void {
		this._requestProjectName().then(_app => {
			const _project: IProjectDefinition | undefined = this.config.getProject(_app);
			if (_project?.type !== "application") {
				this.logging.error("Cannot debug project type " + _project?.type);
				return;
			}
			this.config.copyTsConfigDev().then(() => {
				this.cmd.exec(_project?.debugCommand || `ng serve ${_app}`, this.fileSystem.root);
			});
		});
	}

	private _enqueueBuild(project: string, incremental = false): void {
		this._enqueueDependencies(project, incremental);

		if (!incremental) {
			this._enqueue(project);
			this.logging.log(`Running full build for ${project}...`);
			this._executeBuildQueue();
		} else if (!this.monitor.state.hasChanged(project)) {
			this.logging.log(`No delta for ${project}: skipping incremental build.`);
		} else {
			this._enqueue(project);
			this.logging.log(`Running incremental build for ${project}...`);
			this._executeBuildQueue();
		}
	}

	abstract _requestProjectName(): Promise<string>;

	private _enqueue(project: string): void {
		this.logging.log("Queueing " + project + " for build...");
		this._buildQueue.add(project);
	}

	private _enqueueDependencies(project: string, incremental = false): void {
		const _project: IProjectDefinition | undefined = this.config.getProject(project);

		if (!_project)
			return;

		if (_project.dependencies && _project.dependencies.length) {
			for (let i = 0; i < _project.dependencies.length; i++) {
				const _dependency: string = _project.dependencies[i];

				if (!this.config.getProject(_dependency))
					return this.logging.error(`Invalid dependency listed for ${project}: ${_dependency}.`);

				if (incremental) {
					if (!this.monitor.state.hasChanged(_dependency)) {
						this.logging.log(`No delta for ${_dependency}. Skipping incremental build...`);
						continue;
					} else {
						// one of the dependencies changed so the dependent
						// project must also recompile
						this.monitor.state.change(project);
					}
				}

				this._enqueue(_dependency);
			}
		}
	}

	private _executeBuildQueue(): void {
		if (!this._buildQueue.size)
			return this.logging.info("Build queue is empty -- all projects are up to date.");

		let _commandLine: string = "";

		this._buildQueue.forEach(_project => {
			if (_commandLine)
				_commandLine += " && ";

			const _projectDefintion: IProjectDefinition | undefined = this.config.getProject(_project);

			_commandLine += _projectDefintion?.buildCommand || `ng build ${_project}`;

			this.monitor.state.record(_project);
		});

		this.cmd.exec(_commandLine, this.fileSystem.root);

		this._buildQueue.clear();
		this.monitor.state.save();
	}

}