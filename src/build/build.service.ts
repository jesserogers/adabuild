import { Inject, Injectable } from "@kuroi/syringe";
import { CommandLineService } from "../cmd";
import { ConfigurationService, IProjectDefinition } from "../config";
import { FileSystemService } from "../filesystem";
import { Monitor } from "../monitor";
import { Queue } from "../utils";
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

	private _buildQueue = new Queue<string>();

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
		this._requestProjectName().then(_project =>
			this.config.copyTsConfigProd().then(() => {
				this._enqueueBuild(_project, incremental);
			})
		).catch(() => {
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
		return new Promise(resolve => {
			this.window.inputBox({
				value: this._requestedBuild,
				placeHolder: "Enter project name"
			}).then(_project => {
				this._requestedBuild = _project || "";
				return resolve(this._requestedBuild);
			});
		});
	}

	private _enqueue(project: string): void {
		this.window.log("Queueing " + project + " for build...");
		this._buildQueue.enqueue(project);
	}

	private _enqueueDependencies(project: string, incremental = false): void {
		const _project: IProjectDefinition | undefined = this.config.getProject(project);

		if (!_project)
			return;

		if (_project.dependencies && _project.dependencies.length) {
			for (let i = 0; i < _project.dependencies.length; i++) {
				if (incremental && !this.monitor.hasChanged(_project.dependencies[i])) {
					this.window.log(`No delta for ${_project.dependencies[i]}. Skipping incremental build...`);
					continue;
				}

				this._enqueue(_project.dependencies[i]);
			}
		}
	}

	private _executeBuildQueue(): void {
		let _commandLine: string = "";

		while (this._buildQueue.count) {
			const _project = this._buildQueue.dequeue(); 
			if (_project) {
				if (_commandLine)
					_commandLine += " && ";

				const _projectDefintion: IProjectDefinition | undefined = this.config.getProject(_project);

				_commandLine += _projectDefintion?.buildCommand || `ng build ${_project} --c production`;
				
				this.monitor.record(_project);
			}
		}

		this.cmd.exec(_commandLine, this.fileSystem.root);
	}

}