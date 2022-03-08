import { Inject, Injectable } from "@kuroi/syringe";
import { stdin, stdout } from "process";
import * as readline from "readline";
import { BaseBuildService, BaseCommandLineService, BaseLoggingService, BaseMonitorService, CliCommand } from "../../lib";
import { CliCommandLineService } from "../cmd";
import { IArgumentMap } from "./argument-map.interface";

@Injectable({
	scope: "global"
})
export class CliPromptService {

	private _readline!: readline.Interface;

	constructor(
		@Inject(BaseCommandLineService) private cmd: CliCommandLineService,
		@Inject(BaseBuildService) private build: BaseBuildService,
		@Inject(BaseMonitorService) private monitor: BaseMonitorService,
		@Inject(BaseLoggingService) private logging: BaseLoggingService
	) {

	}

	public start(): void {
		this._readline = readline.createInterface({
			input: stdin,
			output: stdout
		});
		
		this._prompt();
	}

	private _prompt(): void {
		this._readline.question("adabuild > ", answer => {
			const _command: CliCommand = this.cmd.parseCommand(answer);
			this._delegateCommand(_command).then(() => {
				this._prompt();
			});
		});
	}

	private _delegateCommand(command: CliCommand): Promise<number> {
		const [_cmd, ..._args] = command;
	
		switch (_cmd) {

			case "build": {
				const [_project, ..._projectArgs] = _args;
				const _argMap: IArgumentMap = this._parseArgs(_projectArgs);

				const _buildAll: boolean = _argMap.all === "true";
				const _incremental: boolean = _argMap.incremental !== "false";

				if (_buildAll)
					return this.build.buildAllProjects().catch(() => 1);
				else
					return this.build.buildProject(_project, _incremental).catch(() => 1);
			}

			case "reset": {
				const _argMap: IArgumentMap = this._parseArgs(_args);
				const _projects: string[] = _argMap.project?.split(",").map(
					x => x.trim()
				).filter(x => !!x) || [];

				this.monitor.reset(..._projects);
				break;
			}

		}

		return Promise.resolve(0);
	}

	private _parseArgs(args: string[]): IArgumentMap {
		const _args: IArgumentMap = {};
		for (let i = 0; i < args.length; i++) {
			const _argName: string = args[i];
			const _argValue: string = _argName.split("=")[1] || args[i++];
			if (!_argName)
				throw new Error("Invalid arg name");
			if (!_argValue)
				throw new Error("Invalid arg value");
			
			_args[_argName] = _argValue;
		}
		return _args;
	}

}
