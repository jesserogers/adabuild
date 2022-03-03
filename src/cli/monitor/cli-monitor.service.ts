import { Inject, Injectable, OnDestroy } from "@kuroi/syringe";
import { BaseConfigurationService, BaseFileSystemService, BaseLoggingService, BaseMonitorService, BaseMonitorState, IWatcher } from "../../common";
import { ChokidarEventListener } from "../filesystem";

/**
 * @author Jesse Rogers <jesse.rogers@adaptiva.com>
 * @description Listens for changes to the provided Angular projects directory
 */
@Injectable({
	scope: "root"
})
export class CliMonitorService extends BaseMonitorService implements OnDestroy {

	override _watcher!: IWatcher<ChokidarEventListener>;

	constructor(
		@Inject(BaseFileSystemService) fileSystem: BaseFileSystemService,
		@Inject(BaseLoggingService) window: BaseLoggingService,
		@Inject(BaseConfigurationService) config: BaseConfigurationService,
		@Inject(BaseMonitorState) state: BaseMonitorState
	) {
		super(fileSystem, window, config, state);
	}

	public watch(): void {
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
				this._saveStateOnDebounce(_project.name);
			}
		});
	}

	onDestroy(): void {
		super.onDestroy();
	}

}