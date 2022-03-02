import { OnDestroy } from "@kuroi/syringe";
import { BaseConfigurationService } from "../config";
import { BaseFileSystemService } from "../filesystem";
import { IWatcher } from "../filesystem/watcher.interface";
import { BaseLoggingService } from "../logging";
import { debounce, IDisposable } from "../utils";
import { BaseMonitorState } from "./base-monitor-state";

export interface BaseMonitorService {
	start(): void;
	reset(...projects: string[]): void;
}

export abstract class BaseMonitorService implements OnDestroy {

	protected _watcher!: IWatcher<any>;

	protected _changeListener!: IDisposable;

	protected _saveStateOnDebounce: () => void;

	constructor(
		protected fileSystem: BaseFileSystemService,
		protected logging: BaseLoggingService,
		protected config: BaseConfigurationService,
		public state: BaseMonitorState
	) {
		this._saveStateOnDebounce = debounce(() => this.state.save(), 1000);
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
				this.logging.log("Successfully reset " + project);
			});
		} else {
			this.state.clear();
			this.logging.log("Successfully reset all projects");
		}
		this.state.save();
	}

	abstract watch(): void;

	onDestroy(): void {
		this.reset();

		if (this._changeListener)
			this._changeListener.dispose();
		
		if (this._watcher)
			this._watcher.dispose();
	}

}