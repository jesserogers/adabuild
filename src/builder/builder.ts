import { Inject, Injectable, OnInit } from "@kuroi/syringe";
import * as vscode from "vscode";
import { CommandLineService } from "../cmd";
import { IBuildConfig, IProjectDefinition, validateConfig } from "../config";
import { FileSystemService } from "../filesystem";
import { Monitor } from "../monitor";
import { WindowService } from "../window";

/**
 * @author Jesse Rogers <jesse.rogers@adaptiva.com>
 * @description Controls the execution of build commands based on Monitor's change state
 * @see Monitor
 */
@Injectable({
	scope: "global"
})
export class Builder implements OnInit {

	private _buildConfig!: IBuildConfig;

	private _buildQueue = new Set<string>();

	private _lastBuiltProject: string = "";

	constructor(
		@Inject(Monitor) private monitor: Monitor,
		@Inject(CommandLineService) private cmd: CommandLineService,
		@Inject(WindowService) private window: WindowService,
		@Inject(FileSystemService) private fileSystem: FileSystemService
	) {

	}

	public onInit(): void {
		this._loadConfigFile().then(_config => {
			if (!validateConfig(_config)) {
				console.error("Invalid config", _config);
				this.window.error("adabuild: Invalid config file");
				return;
			}
			this.window.log("Extension activated");
			this.setBuildConfig(_config);
			this.monitor.start(_config);
		}).catch(_error => {
			this.window.error(_error);
		});
	}

	public setBuildConfig(_buildConfig: IBuildConfig): void {
		this._buildConfig = _buildConfig;
	}

	public getProject(name: string): IProjectDefinition | undefined {
		return this._buildConfig?.projectDefinitions?.find(_project =>
			_project.name === name
		);
	}

	public generateCommands(): vscode.Disposable[] {
		return [
			// normal build command
			vscode.commands.registerCommand(`adabuild.build`, () => {
				this._requestProjectName().then(_project => {
					this.build(_project);
				}).catch(() => {
					this.window.log("Invalid project name input");
				});
			}),
			// incremental build command
			vscode.commands.registerCommand(`adabuild.incrementalbuild`, () => {
				this._requestProjectName().then(_project => {
					this.build(_project, true);
				}).catch(() => {
					this.window.log("Invalid project name input");
				});
			})
		];
	}

	public build(project: string, incremental = false): void {
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
		return new Promise((resolve, reject) => {
			this.window.inputBox({
				value: this._lastBuiltProject,
				placeHolder: "Enter project name"
			}).then(_project => {
				this._lastBuiltProject = _project || "";
				if (_project) {
					return resolve(_project);
				}
			});
		});
	}

	private _queueDependencies(project: string, incremental = false): void {
		const _project: IProjectDefinition | undefined = this.getProject(project);

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

			const _projectDefintion: IProjectDefinition | undefined = this.getProject(_project);
			_commandLine += _projectDefintion?.buildCommand || "npm run build:" + _project;
			this.monitor.record(_project);
		});

		this.cmd.exec(_commandLine, this.monitor.rootFolderPath);
		this._buildQueue.clear();
	}

	private _loadConfigFile(): Promise<IBuildConfig> {
		const _configFilePath: string = this.monitor.rootFolderPath + "\\adabuild.config.json";
		return this.fileSystem.getJsonFile(_configFilePath);
	}

}