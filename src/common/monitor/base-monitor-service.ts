import { OnDestroy } from "@kuroi/syringe";
import { BaseConfigurationService } from "../config";
import { BaseFileSystemService } from "../filesystem";
import { IWatcher } from "../filesystem/watcher.interface";
import { BaseLoggingService } from "../logging";
import { debounce, IDisposable } from "../utils";
import { BaseMonitorState } from "./base-monitor-state";

export abstract class BaseMonitorService implements OnDestroy {

	protected _changeListener!: IDisposable;

	protected _createListener!: IDisposable;

	protected _deleteListener!: IDisposable;

	protected _saveStateOnDebounce: (project: string) => void;

	protected _watcher!: IWatcher<any>;

	constructor(
		protected fileSystem: BaseFileSystemService,
		protected logging: BaseLoggingService,
		protected config: BaseConfigurationService,
		public state: BaseMonitorState
	) {
		this._saveStateOnDebounce = debounce((project: string) => this._saveState(project), 1000);
	}

	public start(): void {
		if (!this.config.buildConfig)
			return;

		this.watch();
	}
	
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

	abstract watch(): void;

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

	private _saveState(project: string): void {
		this.logging.log("BaseMonitorService._saveState", project + " changed");
		this.state.change(project);
	}

}