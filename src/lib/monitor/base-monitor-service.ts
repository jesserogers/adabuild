import { OnDestroy } from "@kuroi/syringe";
import { BaseConfigurationService } from "../config";
import { BaseFileSystemService, ChokidarEventListener, IWatcher } from "../filesystem";
import { BaseLoggingService } from "../logging";
import { debounce, IDisposable } from "../utils";
import { BaseMonitorState } from "./base-monitor-state";

/**
 * @author Jesse Rogers <jesse.rogers@adaptiva.com>
 * @description Invokes the file system watcher and updates its state object accordingly
 * @see BaseMonitorState
 * @see BaseFileSystemService
 */
export abstract class BaseMonitorService implements OnDestroy {

	protected _changeListener!: IDisposable;

	protected _createListener!: IDisposable;

	protected _deleteListener!: IDisposable;

	protected _saveStateOnDebounce: () => void;

	protected _watcher!: IWatcher<ChokidarEventListener>;

	constructor(
		protected fileSystem: BaseFileSystemService,
		protected logging: BaseLoggingService,
		protected config: BaseConfigurationService,
		public state: BaseMonitorState
	) {
		this._saveStateOnDebounce = debounce(() => this.state.save(), 1000);
	}

	/** Start watching files */
	public start(): void {
		if (!this.config.buildConfig)
			return;

		this._watch();
	}
	
	/** Supply a list of projects to remove from state */
	public reset(...projects: string[]): void {
		if (projects.length) {
			projects.forEach(project => {
				this.state.clear(project);
				this.logging.log("BaseMonitorService.reset", "Successfully reset " + project);
			});
		} else {
			this.state.clear();
			this.logging.log("BaseMonitorService.reset", "Successfully reset all projects");
		}
		this.state.save();
	}

	private _watch(): void {
		if (this._watcher)
			this._watcher.dispose();
	
		this._watcher = this.fileSystem.watch(this.config.buildConfig.projectsRootGlob);
		this._changeListener = this._watcher.onDidChange(_path => this._checkChanges(_path));
		this._createListener = this._watcher.onDidCreate(_path => this._checkChanges(_path));
		this._deleteListener = this._watcher.onDidDelete(_path => this._checkChanges(_path));
	}

	private _checkChanges(path: string): void {
		this.config.buildConfig.projectDefinitions.forEach(_project => {
			if (path.includes(`\\${_project.name}\\`)) {
				this.state.change(_project.name);
				this._saveStateOnDebounce();
			}
		});
	}

	onDestroy(): void {
		this.reset();

		if (this._changeListener)
			this._changeListener.dispose();

		if (this._createListener)
			this._createListener.dispose();

		if (this._deleteListener)
			this._deleteListener.dispose();
		
		if (this._watcher)
			this._watcher.dispose();
	}

}