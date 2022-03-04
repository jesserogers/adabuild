import { Inject, Injectable, OnDestroy } from "@kuroi/syringe";
import { BaseConfigurationService, BaseFileSystemService, BaseLoggingService, BaseMonitorService, BaseMonitorState, ChokidarEventListener, IWatcher } from "../../common";

/**
 * @author Jesse Rogers <jesse.rogers@adaptiva.com>
 * @description Listens for changes to the provided Angular projects directory
 */
@Injectable({
	scope: "root"
})
export class CliMonitorService extends BaseMonitorService implements OnDestroy {

	_watcher!: IWatcher<ChokidarEventListener>;

	constructor(
		@Inject(BaseFileSystemService) fileSystem: BaseFileSystemService,
		@Inject(BaseLoggingService) window: BaseLoggingService,
		@Inject(BaseConfigurationService) config: BaseConfigurationService,
		@Inject(BaseMonitorState) state: BaseMonitorState
	) {
		super(fileSystem, window, config, state);
	}

}