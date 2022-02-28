import { Inject, Injectable, OnDestroy } from "@kuroi/syringe";
import * as vscode from "vscode";
import { ConfigurationService } from "../config";
import { FileSystemService } from "../filesystem";
import { WindowService } from "../window";

/**
 * @author Jesse Rogers <jesse.rogers@adaptiva.com>
 * @description Listens for changes to the provided Angular projects directory
 */
@Injectable({
	scope: "root"
})
export class Monitor implements OnDestroy {

	private _changedLibraries = new Set<string>();

	private _history = new Map<string, number>();

	private _watcher!: vscode.FileSystemWatcher;

	private _changeListener!: vscode.Disposable;

	constructor(
		@Inject(ConfigurationService) private config: ConfigurationService,
		@Inject(FileSystemService) private fileSystem: FileSystemService,
		@Inject(WindowService) private window: WindowService	
	) {

	}

	public start(): void {
		if (!this.config.buildConfig)
			return;

		if (this._watcher)
			this._watcher.dispose();
	
		this._watcher = this.fileSystem.watch(this.config.buildConfig.projectsRootGlob);
		this._changeListener = this._watcher.onDidChange(uri => {
			this.config.buildConfig.projectDefinitions.forEach(_project => {
				if (_project?.type === "library" && uri.path.includes(`/${_project.name}/`)) {
					this.window.log(_project.name + " changed");
					this._changedLibraries.add(_project.name);
				}
			});
		});
	}

	public reset(project?: string): void {
		if (project) {
			this._history.delete(project);
			this.window.log("Successfully reset " + project);
		} else {
			this._changedLibraries.clear();
			this._history.clear();
			this.window.log("Successfully reset all projects");
		}
	}

	public hasChanged(library: string): boolean {
		return this._changedLibraries.has(library) || !this._history.has(library);
	}

	public record(project: string): void {
		const _previous: number | undefined = this._history.get(project);
		this._history.set(project, (_previous || 0) + 1);
	}

	onDestroy(): void {
		this.reset();

		if (this._changeListener)
			this._changeListener.dispose();
		
		if (this._watcher)
			this._watcher.dispose();
	}

}