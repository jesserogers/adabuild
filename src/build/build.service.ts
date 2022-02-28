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
			this._queueBuild(_project, incremental);
		}).catch(() => {
			this.window.log("Invalid project name input");
		});
	}

	public _queueBuild(project: string, incremental = false): void {
		this._queueDependencies(project, incremental);

		if (!incremental) {
			this._enqueue(project);
			this._executeBuildQueue();
		} else if (!this.monitor.hasChanged(project)) {
			this.window.log(`No delta for ${project}: skipping incremental build`);
		} else {
			this._enqueue(project);
			this._executeBuildQueue();
			this.window.log(`Running incremental build for ${project}...`);
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

	private _queueDependencies(project: string, incremental = false): void {
		const _project: IProjectDefinition | undefined = this.config.getProject(project);

		if (!_project)
			return;

		if (_project.dependencies && _project.dependencies.length) {
			for (let i = 0; i < _project.dependencies.length; i++) {
				if (incremental && !this.monitor.hasChanged(_project.dependencies[i]))
					continue;

				this._enqueue(_project.dependencies[i]);
			}
		}
	}

	private _enqueue(project: string): void {
		this.window.log("Queueing " + project + " for build...");
		this._buildQueue.add(project);
	}

	private _executeBuildQueue(): void {
		let _commandLine: string = "";

		this._buildQueue.forEach(_project => {
			if (_commandLine)
				_commandLine += " && ";

			const _projectDefintion: IProjectDefinition | undefined = this.config.getProject(_project);
			_commandLine += _projectDefintion?.buildCommand || "npm run build:" + _project;
			this.monitor.record(_project);
		});

		this.cmd.exec(_commandLine, this.fileSystem.root);
		this._buildQueue.clear();
	}

}