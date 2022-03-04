import { Inject, Injectable } from "@kuroi/syringe";
import { workspace } from "vscode";
import { BaseFileSystemService, BaseLoggingService, ChokidarService } from "../../common";

/**
 * @author Jesse Rogers <jesse.rogers@adaptiva.com>
 * @description Singleton service for VS Code filesystem API
 */
@Injectable({
	scope: "global"
})
export class FileSystemService extends BaseFileSystemService implements FileSystemService {

	private _root: string = "";

	get root(): string {
		if (workspace.workspaceFolders)
			this._root = workspace.workspaceFolders[0].uri.fsPath;
		return this._root || "";
	}

	constructor(
		@Inject(BaseLoggingService) logging: BaseLoggingService,
		@Inject(ChokidarService) chokidar: ChokidarService
	) {
		super(logging, chokidar);
	}

}