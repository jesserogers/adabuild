import { Inject, Injectable } from "@kuroi/syringe";
import { BaseBuildService, BaseCommandLineService, BaseConfigurationService, BaseFileSystemService, BaseLoggingService, BaseMonitorService, CommandLineTask, IProjectDefinition } from "../../common";

/**
 * @author Jesse Rogers <jesse.rogers@adaptiva.com>
 * @description Controls the execution of build commands
 * @see Monitor
 */
@Injectable({
	scope: "global"
})
export class CliBuildService extends BaseBuildService {

	constructor(
		@Inject(BaseMonitorService) monitor: BaseMonitorService,
		@Inject(BaseCommandLineService) cmd: BaseCommandLineService,
		@Inject(BaseLoggingService) logging: BaseLoggingService,
		@Inject(BaseFileSystemService) fileSystem: BaseFileSystemService,
		@Inject(BaseConfigurationService) config: BaseConfigurationService
	) {
		super(monitor, cmd, logging, fileSystem, config);
	}

	_requestProjectName(): Promise<string> {
		// CLI doesn't ask for project separately -- it comes as part of build command
		return Promise.resolve("");
	}

}