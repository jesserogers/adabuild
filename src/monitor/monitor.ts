import { Inject, Injectable, OnDestroy } from "@kuroi/syringe";
import * as vscode from "vscode";
import { ConfigurationService } from "../config";
import { FileSystemService } from "../filesystem";
import { WindowService } from "../window";
import { debounce } from "../utils";
import { MonitorState } from "./monitor-state";
import { IMonitorState } from "./monitor-state.interface";

/**
 * @author Jesse Rogers <jesse.rogers@adaptiva.com>
 * @description Listens for changes to the provided Angular projects directory
 */
@Injectable({
	scope: "root"
})
export class Monitor implements OnDestroy {

	private static readonly STATE_FILE_NAME: string = ".adabuildstate";

	private _changed: Set<string> = new Set();

	private _history: Map<string, number> = new Map();

	private _watcher!: vscode.FileSystemWatcher;

	private _changeListener!: vscode.Disposable;

	private _saveStateOnDebounce = debounce(this.saveState.bind(this), 1000);

	private get _statePath(): string {
		return this.fileSystem.root + "\\" + Monitor.STATE_FILE_NAME;
	}

	constructor(
		@Inject(ConfigurationService) private config: ConfigurationService,
		@Inject(FileSystemService) private fileSystem: FileSystemService,
		@Inject(WindowService) private window: WindowService	
	) {

	}

	public start(): void {
		if (!this.config.buildConfig)
			return;

		this._fetchPreviousState();
		this._watchProjects();
	}

	public reset(...projects: string[]): void {
		if (projects.length) {
			projects.forEach(project => {
				this._changed.delete(project);
				this._history.delete(project);
				this.window.log("Successfully reset " + project);
			});
		} else {
			this._changed.clear();
			this._history.clear();
			this.window.log("Successfully reset all projects");
		}
		this.saveState();
	}

	public hasChanged(library: string): boolean {
		return this._changed.has(library) || !this._history.has(library);
	}

	public registerChange(project: string): void {
		this._changed.add(project);
	}

	public record(project: string): void {
		const _previous: number | undefined = this._history.get(project);
		this._history.set(project, (_previous || 0) + 1);
		this._changed.delete(project);
	}

	public saveState(): void {
		const _state: MonitorState = new MonitorState(this._changed, this._history);

		this.window.log(`Saving state to ${Monitor.STATE_FILE_NAME}...`);
		this.fileSystem.writeFile(this._statePath, _state.export());
	}

	private _watchProjects(): void {
		if (this._watcher)
			this._watcher.dispose();
	
		this._watcher = this.fileSystem.watch(this.config.buildConfig.projectsRootGlob);
		this._changeListener = this._watcher.onDidChange(uri => {
			this.config.buildConfig.projectDefinitions.forEach(_project => {
				if (_project?.type === "library" && uri.path.includes(`/${_project.name}/`)) {
					this.window.log(_project.name + " changed");
					this._changed.add(_project.name);

					this._saveStateOnDebounce();
				}
			});
		});
	}

	private _fetchPreviousState(): void {
		this.fileSystem.getJsonFile<IMonitorState>(this._statePath).then(_state => {
			if (!_state)
				return;

			this.window.log("Found existing state file.");

			try {
				if (_state.changed)
					_state.changed.forEach(_project => this._changed.add(_project));

				if (_state.history)
					for (const _project in _state.history)
						if (_state.history[_project])
							this._history.set(_project, _state.history[_project]);

			} catch (_err) {
				console.error(_err);
				this.window.error("Failed to parse state file.");
			}

		}).catch(_error => {
			this.window.log(_error);
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