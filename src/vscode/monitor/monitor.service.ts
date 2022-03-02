import { Inject, Injectable, OnDestroy } from "@kuroi/syringe";
import { Event, Uri } from "vscode";
import { BaseConfigurationService, BaseFileSystemService, BaseLoggingService, BaseMonitorService, BaseMonitorState, IWatcher } from "../../common";

/**
 * @author Jesse Rogers <jesse.rogers@adaptiva.com>
 * @description Listens for changes to the provided Angular projects directory
 */
@Injectable({
	scope: "root"
})
export class MonitorService extends BaseMonitorService implements OnDestroy {

	override _watcher!: IWatcher<Event<Uri>>;

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
		this._changeListener = this._watcher.onDidChange(uri => this._checkChanges(uri));
		this._createListener = this._watcher.onDidCreate(uri => this._checkChanges(uri));
		this._deleteListener = this._watcher.onDidDelete(uri => this._checkChanges(uri));
	}

	private _checkChanges(uri: Uri): void {
		this.config.buildConfig.projectDefinitions.forEach(_project => {
			if (uri.path.includes(`/${_project.name}/`)) {
				this._saveStateOnDebounce(_project.name);
			}
		});
	}

	onDestroy(): void {
		super.onDestroy();
	}

}