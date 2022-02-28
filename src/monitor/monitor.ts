import { Inject, Injectable, OnDestroy } from "@kuroi/syringe";
import * as vscode from "vscode";
import { IBuildConfig } from "../config";
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

	private _buildConfig!: IBuildConfig;

	private _rootFolderPath!: string;

	private _changedLibraries = new Set<string>();

	private _history = new Map<string, number>();

	private _watcher!: vscode.FileSystemWatcher;

	private _changeListener!: vscode.Disposable;

	get rootFolderPath(): string {
		if (vscode.workspace.workspaceFolders)
			this._rootFolderPath = vscode.workspace.workspaceFolders[0].uri.fsPath;

		return this._rootFolderPath || "";
	}

	constructor(
		@Inject(FileSystemService) private fileSystem: FileSystemService,
		@Inject(WindowService) private window: WindowService	
	) {

	}

	public start(config: IBuildConfig): void {
		if (this._watcher)
			this._watcher.dispose();

		this._buildConfig = config;
		this._watcher = this.fileSystem.watch(this._buildConfig.projectsRootGlob);
		this._changeListener = this._watcher.onDidChange(uri => {
			this._buildConfig.projectDefinitions.forEach(_project => {
				if (_project?.type === "library" && uri.path.includes(`/${_project.name}/`)) {
					this.window.log(_project.name + " changed");
					this._changedLibraries.add(_project.name);
				}
			});
		});
	}

	public reset(): void {
		this._changedLibraries.clear();
		this._history.clear();

		if (this._changeListener)
			this._changeListener.dispose();
		
		if (this._watcher)
			this._watcher.dispose();
	}

	public hasChanged(library: string): boolean {
		return this._changedLibraries.has(library) || !this._history.has(library);
	}

	public hasProject(project: string): boolean {
		return !!(this._buildConfig && this._buildConfig.projectDefinitions.find(_project =>
			_project.name === project
		));
	}

	public hasBuilt(project: string): Promise<boolean> {
		if (!this._history.get(project) || !this.rootFolderPath)
			return Promise.resolve(false);

		return this.fileSystem.getDirectory(this.rootFolderPath + "\\dist").then(_dist => {
			for (const [_name, _type] of _dist)
				if (_type === vscode.FileType.Directory && this.hasProject(_name))
					return true;
	
			return false;
		});
	}

	public record(project: string): void {
		const _previous: number | undefined = this._history.get(project);
		this._history.set(project, (_previous || 0) + 1);
	}

	onDestroy(): void {
		this.reset();
	}

}