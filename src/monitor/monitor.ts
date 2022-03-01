import { Inject, Injectable, OnDestroy } from "@kuroi/syringe";
import * as vscode from "vscode";
import { ConfigurationService } from "../config";
import { FileSystemService } from "../filesystem";
import { debounce } from "../utils";
import { WindowService } from "../window";
import { MonitorState } from "./monitor-state";

/**
 * @author Jesse Rogers <jesse.rogers@adaptiva.com>
 * @description Listens for changes to the provided Angular projects directory
 */
@Injectable({
	scope: "root"
})
export class Monitor implements OnDestroy {

	private _watcher!: vscode.FileSystemWatcher;

	private _changeListener!: vscode.Disposable;

	private _saveStateOnDebounce: () => void;

	constructor(
		@Inject(ConfigurationService) private config: ConfigurationService,
		@Inject(FileSystemService) private fileSystem: FileSystemService,
		@Inject(WindowService) private window: WindowService,
		@Inject(MonitorState) public state: MonitorState
	) {
		this._saveStateOnDebounce = debounce(this.state.save.bind(this), 1000);
	}

	public start(): void {
		if (!this.config.buildConfig)
			return;

		this._watchProjects();
	}

	public reset(...projects: string[]): void {
		if (projects.length) {
			projects.forEach(project => {
				this.state.clear(project);
				this.window.log("Successfully reset " + project);
			});
		} else {
			this.state.clear();
			this.window.log("Successfully reset all projects");
		}
		this.state.save();
	}

	public saveState(): void {
		this.state.save();
	}

	private _watchProjects(): void {
		if (this._watcher)
			this._watcher.dispose();
	
		this._watcher = this.fileSystem.watch(this.config.buildConfig.projectsRootGlob);
		this._changeListener = this._watcher.onDidChange(uri => {
			this.config.buildConfig.projectDefinitions.forEach(_project => {
				if (_project?.type === "library" && uri.path.includes(`/${_project.name}/`)) {
					this.window.log(_project.name + " changed");
					this.state.change(_project.name);

					this._saveStateOnDebounce();
				}
			});
		});
	}

	onDestroy(): void {
		this.reset();

		if (this._changeListener)
			this._changeListener.dispose();
		
		if (this._watcher)
			this._watcher.dispose();
	}

}