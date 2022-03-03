import { Inject, Injectable } from "@kuroi/syringe";
import { stdin, stdout } from "process";
import * as readline from "readline";
import { BaseBuildService, BaseCommandLineService, BaseFileSystemService, BaseLoggingService, BaseMonitorService, CliCommand, CommandLineTask } from "../../common";
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
		@Inject(BaseFileSystemService) private fileSystem: BaseFileSystemService,
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
		this._readline.question("adabuild > ", async answer => {
			const _command: CliCommand = this.cmd.parseCommand(answer);
			await this._delegateCommand(_command);
			this._prompt();
		});
	}

	private _delegateCommand(command: CliCommand): Promise<void> {
		const [_cmd, ..._args] = command;
	
		switch (_cmd) {

			case "parallel": {
				return this.cmd.execParallel(
					new CommandLineTask({ command: "echo", args: ["ur mom"], output: true }),
					new CommandLineTask({ command: "echo", args: ["ur mom 2"], output: true })
				).then(code => {
					this.logging.log("CliPromptService._delegateCommand#parallel", "Exited with code " + code);
				}).catch(err => {
					this.logging.error(err);
				});
			}

			case "build": {
				const [_project, ..._projectArgs] = _args;
				const _argMap: IArgumentMap = this._parseArgs(_projectArgs);

				const _buildAll: boolean = _argMap.all === "true";
				const _incremental: boolean = _argMap.incremental !== "false";

				if (_buildAll)
					this.build.buildAllProjects();
				else
					this.build.buildProject(_project, _incremental);

				break;
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

		return Promise.resolve();
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
