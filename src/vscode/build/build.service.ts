import { Inject, Injectable } from "@kuroi/syringe";
import { BaseBuildService, BaseCommandLineService, BaseConfigurationService, BaseFileSystemService, BaseLoggingService, BaseMonitorService } from "../../lib";
import { WindowService } from "../window";

/**
 * @author Jesse Rogers <jesse.rogers@adaptiva.com>
 * @description Controls the execution of build commands
 * @see Monitor
 */
@Injectable({
	scope: "global"
})
export class BuildService extends BaseBuildService {

	constructor(
		@Inject(BaseMonitorService) monitor: BaseMonitorService,
		@Inject(BaseCommandLineService) cmd: BaseCommandLineService,
		@Inject(BaseLoggingService) private window: WindowService,
		@Inject(BaseFileSystemService) fileSystem: BaseFileSystemService,
		@Inject(BaseConfigurationService) config: BaseConfigurationService
	) {
		super(monitor, cmd, window, fileSystem, config);
	}

	_requestProjectName(): Promise<string> {
		return new Promise((resolve, _reject) => {
			this.window.inputBox({
				value: this._requestedBuild,
				placeHolder: "Enter project name"
			}).then(
				_project => {
					this._requestedBuild = _project || "";
					return resolve(this._requestedBuild);
				},
				_error => {
					this.logging.error("BuildService._requestProjectName", "Unexpected error requesting project name: " + _error);
				}
			);
		});
	}

}