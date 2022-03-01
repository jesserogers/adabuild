import { Inject, Injectable } from "@kuroi/syringe";
import { CommandLineService } from "../cmd";
import { ConfigurationService, IProjectDefinition } from "../config";
import { FileSystemService } from "../filesystem";
import { Monitor } from "../monitor";
import { WindowService } from "../window";

/**
 * @author Jesse Rogers <jesse.rogers@adaptiva.com>
 * @description Controls the execution of build commands
 * @see Monitor
 */
@Injectable({
	scope: "global"
})
export class BuildService {

	private _buildQueue = new Set<string>();

	private _requestedBuild: string = "";

	constructor(
		@Inject(Monitor) private monitor: Monitor,
		@Inject(CommandLineService) private cmd: CommandLineService,
		@Inject(WindowService) private window: WindowService,
		@Inject(FileSystemService) private fileSystem: FileSystemService,
		@Inject(ConfigurationService) private config: ConfigurationService
	) {

	}

	public build(incremental: boolean = false): void {
		this._requestProjectName().then(_project => {
			if (!this.config.getProject(_project))
				return this.window.error("Invalid project name \" + _project + \"");

			return this.config.copyTsConfigProd().then(() => {
				this._enqueueBuild(_project, incremental);
			});
		}).catch(() => {
			this.window.log("Invalid project name input");
		});
	}

	public buildAllProjects(): void {
		this._buildQueue.clear();
		this.config.buildConfig.projectDefinitions.forEach(_project => {
			this._enqueueBuild(_project.name, true);
		});
		this.window.log("Building all projects...");
		this._executeBuildQueue();
	}

	public buildServerJar(): void {
		const _path: string = this.fileSystem.root.replace(
			"CloudFramework", "buildsystem/tools/buildfiles_evolve"
		);
		this.cmd.exec("buildServerJar", _path);
	}

	public buildClientJar(): void {
		const _path: string = this.fileSystem.root.replace(
			"CloudFramework", "buildsystem/tools/buildfiles_evolve"
		);
		this.cmd.exec("buildClientJar", _path);
	}

	public debugApplication(): void {
		this._requestProjectName().then(_app => {
			const _project: IProjectDefinition | undefined = this.config.getProject(_app);
			if (_project?.type !== "application") {
				this.window.error("Cannot debug project type " + _project?.type);
				return;
			}
			this.config.copyTsConfigDev().then(() => {
				this.cmd.exec(_project?.debugCommand || `ng serve ${_app}`);
			});
		});
	}

	public _enqueueBuild(project: string, incremental = false): void {
		this._enqueueDependencies(project, incremental);

		if (!incremental) {
			this._enqueue(project);
			this.window.log(`Running full build for ${project}...`);
			this._executeBuildQueue();
		} else if (!this.monitor.hasChanged(project)) {
			this.window.log(`No delta for ${project}: skipping incremental build`);
		} else {
			this._enqueue(project);
			this.window.log(`Running incremental build for ${project}...`);
			this._executeBuildQueue();
		}
	}

	private _requestProjectName(): Promise<string> {
		return new Promise((resolve, _reject) => {
			this.window.inputBox({
				value: this._requestedBuild,
				placeHolder: "Enter project name"
			}).then(
				_project => {
					this._requestedBuild = _project || "";
					return resolve(this._requestedBuild);
				},
				_error => {
					this.window.error("Unexpected error requesting project name: " + _error);
				}
			);
		});
	}

	private _enqueue(project: string): void {
		this.window.log("Queueing " + project + " for build...");
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
					return this.window.error(`Invalid dependency listed for ${project}: ${_dependency}`);

				if (incremental) {
					if (!this.monitor.hasChanged(_dependency)) {
						this.window.log(`No delta for ${_dependency}. Skipping incremental build...`);
						continue;
					} else {
						// one of the dependencies changed so the dependent
						// project must also recompile
						this.monitor.registerChange(project);
					}
				}

				this._enqueue(_dependency);
			}
		}
	}

	private _executeBuildQueue(): void {
		if (!this._buildQueue.size)
			return this.window.info("Build queue is empty -- all projects are up to date.");

		let _commandLine: string = "";

		this._buildQueue.forEach(_project => {
			if (_commandLine)
				_commandLine += " && ";

			const _projectDefintion: IProjectDefinition | undefined = this.config.getProject(_project);

			_commandLine += _projectDefintion?.buildCommand || `ng build ${_project}`;

			this.monitor.record(_project);
		});

		this.cmd.exec(_commandLine, this.fileSystem.root);
		this._buildQueue.clear();
	}

}