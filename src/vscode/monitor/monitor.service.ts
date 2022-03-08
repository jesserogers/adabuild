import { Inject, Injectable, OnDestroy } from "@kuroi/syringe";
import { BaseConfigurationService, BaseFileSystemService, BaseLoggingService, BaseMonitorService, BaseMonitorState } from "../../lib";

/**
 * @author Jesse Rogers <jesse.rogers@adaptiva.com>
 * @description Listens for changes to the provided Angular projects directory
 */
@Injectable({
	scope: "root"
})
export class MonitorService extends BaseMonitorService implements OnDestroy {

	constructor(
		@Inject(BaseFileSystemService) fileSystem: BaseFileSystemService,
		@Inject(BaseLoggingService) window: BaseLoggingService,
		@Inject(BaseConfigurationService) config: BaseConfigurationService,
		@Inject(BaseMonitorState) state: BaseMonitorState
	) {
		super(fileSystem, window, config, state);
	}

	onDestroy(): void {
		super.onDestroy();
	}

}