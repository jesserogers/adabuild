import { Inject, Injectable } from "@kuroi/syringe";
import { ChildProcess, spawn } from "child_process";
import { TextDecoder } from "util";
import { BaseCommandLineService, BaseLoggingService, CliCommand, CommandLineTask } from "../../lib";

/**
 * @author Jesse Rogers <jesse.rogers@adaptiva.com>
 * @description Provides a simplified interface to VS Code's terminal execution API
 */
@Injectable({
	scope: "global"
})
export class CliCommandLineService extends BaseCommandLineService {

	private _currentCommand!: CliCommand;

	constructor(
		@Inject(BaseLoggingService) logging: BaseLoggingService,
		@Inject(TextDecoder) decoder: TextDecoder
	) {
		super(logging, decoder);
	}

	public exec(task: CommandLineTask): Promise<number> {
		return new Promise((resolve, reject) => {
			const _process: ChildProcess = spawn(task.command, {
				cwd: task.directory
			});

			_process.on("exit", code => {
				this._destroyProcess(_process);
				resolve(code || 0);
			});

			_process.on("error", _error => {
				this._destroyProcess(_process);
				reject(_error);
			});

			if (task.output)
				_process.stdout?.on("data", out => console.log(out));

			this._processes.set(_process.pid, _process);

		});
	}

	public getCurrentCommand(): CliCommand {
		return this._currentCommand;
	}

	public setCurrentCommand(command: CliCommand): void {
		this._currentCommand = command;
	}

}