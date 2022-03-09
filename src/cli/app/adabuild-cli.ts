import { Inject, Injectable } from "@kuroi/syringe";
import { BaseConfigurationService, BaseLoggingService, BaseMonitorService } from "../../lib";
import { CliPromptService } from "../prompt";

@Injectable({
	scope: "global"
})
export class AdaBuildCli {

	constructor(
		@Inject(BaseLoggingService) private logging: BaseLoggingService,
		@Inject(BaseConfigurationService) private config: BaseConfigurationService, 
		@Inject(CliPromptService) private prompt: CliPromptService,
		@Inject(BaseMonitorService) private monitor: BaseMonitorService
	) {
		logging.log("AdaBuildCli", "CLI activated");
	}

	public parseCommand(command: string, ...args: string[]): void {
		if (!command) {
			throw new Error("[AdaBuildCli.parseCommand] No command received");
		}

		const _cli: any = this as any;

		if (!_cli[command]) {
			throw new Error("[AdaBuildCli.parseCommand] Invalid command: " + command);
		}

		_cli[command](...args);
	}

	public help(): void {
		console.log(`Enter "adabuild run" to start the application.

		Commands:		build [project | all]
							[desc]: Compiles a project and its dependencies
							[flags]:
								--incremental [default = true]
							[ex]:
								build my-project --incremental=false
								build all

						debug [project]
							[desc]: Run a project in debug mode
							[ex]:
								debug my-project

						stop
							[desc]: End all adabuild child processes

						reset [...projects]
							[desc]: Clear build and change history for a list of projects
							[ex]:
								reset my-project,my-other-project
								reset // note: if no project list, adabuild will reset everything

		`);
		process.exit(0);
	}

	public run(): void {
		this.config.loadConfiguration().then(() => {
			this.monitor.start();
			this.prompt.start();
		}).catch(_error => {
			this.logging.error("AdaBuildCli.run", _error);
		});
	}

}