import { Inject, Injectable } from "@kuroi/syringe";
import { BaseFileSystemService, BaseLoggingService, ChokidarService } from "../../common";

/**
 * @author Jesse Rogers <jesse.rogers@adaptiva.com>
 * @description Singleton service for VS Code filesystem API
 */
@Injectable({
	scope: "global"
})
export class CliFileSystemService extends BaseFileSystemService implements BaseFileSystemService {

	private _root: string = process.cwd();

	get root(): string {
		return this._root;
	}

	constructor(
		@Inject(BaseLoggingService) logging: BaseLoggingService,
		@Inject(ChokidarService) chokidar: ChokidarService
	) {
		super(logging, chokidar);
	}

}