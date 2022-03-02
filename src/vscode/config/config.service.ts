import { Inject, Injectable } from "@kuroi/syringe";
import { BaseConfigurationService, BaseFileSystemService, BaseLoggingService } from "../../common";
;

/**
 * @author Jesse Rogers
 * @description Singleton service for managing configuration files
 */
@Injectable({
	scope: "global"
})
export class ConfigurationService extends BaseConfigurationService {

	constructor(
		@Inject(BaseFileSystemService) fileSystem: BaseFileSystemService,
		@Inject(BaseLoggingService) logging: BaseLoggingService
	) {
		super(fileSystem, logging);
	}

}
