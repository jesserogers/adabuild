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
		console.log(`
		Commands		run

						build [project | all]
							[Flags]:
								--incremental [default = true]
							[ex]:
								build my-project --incremental=false
								build all
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