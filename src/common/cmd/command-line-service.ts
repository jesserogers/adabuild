import { ChildProcess, fork } from "child_process";
import { cpus } from "os";
import { TextDecoder } from "util";
import { BaseLoggingService } from "../logging";
import { IChildProcessMessage } from "./child-process-message.interface";
import { CliCommand } from "./cli-command.type";
import { CommandLineTask } from "./command-line-task.interface";

export abstract class BaseCommandLineService implements BaseCommandLineService {

	public availableCores: number = 1;

	protected _processes: Map<number, ChildProcess> = new Map();

	constructor(
		protected logging: BaseLoggingService,
		protected decoder: TextDecoder
	) {
		this.availableCores = cpus().length - 1;
	}

	abstract exec(task: CommandLineTask): any;

	/** Forks tasks into concurrent threads */
	public async execParallel(...tasks: CommandLineTask[]): Promise<number> {
		return new Promise(async (resolve, reject) => {
			
			let _counter: number = 0;
			const _loadBalancedTasks: CommandLineTask[][] = this._loadBalanceTasks(tasks);
			
			for (let i = 0; i < _loadBalancedTasks.length; i++) {
				const _tasks: CommandLineTask[] = _loadBalancedTasks[i];
				const _code: number = await this._runParallelTasks(_tasks,
					_out => {
						const _value: string = _out.value.type === "Buffer"
							? this.decoder.decode(new Uint8Array(_out.value.data))
							: `${_out.value}`;
							
						this.logging.log(`Process (${_out.taskId}):`, _value);
					},
					_close => {
						this.logging.log(`Closing process (${_close.taskId})...`);
					}
				);

				if (_code > 0) {
					this.abort();
					return reject(_code);
				} else if (_code === 0) {
					_counter++;
					if (_counter === tasks.length)
						return resolve(0);
				}
			}
		});
	}

	public abort(): void {
		this._processes.forEach(_process => this._destroyProcess(_process));
	}

	public parseCommand(command: string): CliCommand {
		// @todo: validate
		return command?.split(" ") as [string, ...string[]] || [];
	}

	private _spawnProcess(): ChildProcess {
		return fork(__dirname + "\\thread.js");;
	}

	private async _runParallelTasks(
		_tasks: CommandLineTask[],
		_onStdout?: (_message: IChildProcessMessage) => void,
		_onClose?: (_message: IChildProcessMessage) => void
	): Promise<number> {
		return new Promise(async (resolve, reject) => {

			let _counter: number = 0;
			const _process: ChildProcess = this._spawnProcess();
			this._processes.set(_process.pid, _process);

			for (let i = 0; i < _tasks.length; i++) {
				try {
					const _exitCode = await this._runTask(_process, _tasks[i], _onStdout, _onClose);
					if (_exitCode > 0) {
						this._destroyProcess(_process);
						return reject(_exitCode);
					}
					if (_exitCode === 0) {
						_counter++;
						// last task completed successfully
						if (_counter === _tasks.length) {
							this._destroyProcess(_process);
							return resolve(_exitCode);
						}
					}
				} catch (_err) {
					this.logging.error("BaseCommandLineService._runParallelTasks", _err);
				}
			}
		});
	}

	protected _runTask(
		_process: ChildProcess,
		_task: CommandLineTask,
		_onStdout?: (_message: IChildProcessMessage) => void,
		_onClose?: (_message: IChildProcessMessage) => void
	): Promise<number> {
		return new Promise((resolve, reject) => {
			_process.on("message", (_message: IChildProcessMessage) => {

				if (_message.taskId !== _task.taskId)
					return;
	
				switch (_message.type) {
					case "stdout":
						if (_onStdout)
							_onStdout(_message);
						break;

					case "exit":
						resolve(_message.value);
						break;

					case "close":
						if (_onClose)
							_onClose(_message);
						break;

					case "error":
						reject(_message.value);
						break;

					default: throw new Error("Invalid message type: " + _message.type);
				}
			});

			_process.send(_task);
		});
	}

	protected _destroyProcess(_process: ChildProcess): void {
		_process.removeAllListeners("message");
		_process.kill();
		this._processes.delete(_process.pid);
	}

	private _loadBalanceTasks(_tasks: CommandLineTask[]): CommandLineTask[][] {
		const _loadBalancedTasks: CommandLineTask[][] = [];

		for (let i = 0; i < _tasks.length; i++) {
			const _slot: number = i % this.availableCores;

			if (_loadBalancedTasks[_slot])
				_loadBalancedTasks[_slot].push(_tasks[i]);
			else
				_loadBalancedTasks[_slot] = [_tasks[i]];
		}

		return _loadBalancedTasks;
	}

}