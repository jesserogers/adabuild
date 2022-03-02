import { Inject, Injectable, OnInit } from "@kuroi/syringe";
import { BaseFileSystemService, BaseLoggingService, BaseMonitorState } from "../../common";

@Injectable()
export class MonitorState extends BaseMonitorState implements OnInit {

	constructor(
		@Inject(BaseFileSystemService) fileSystem: BaseFileSystemService,
		@Inject(BaseLoggingService) window: BaseLoggingService
	) {
		super(fileSystem, window);
	}

	onInit(): void {
		super.onInit();
	}

}