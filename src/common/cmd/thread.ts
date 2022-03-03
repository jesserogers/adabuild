import { ChildProcess, exec } from "child_process";
import * as process from "process";
import { CommandLineTask } from "./command-line-task.interface";

const _messageHandler = (type: string, taskId?: string, value?: any): void => {
	process.send && process.send({ taskId, type, value });
};

process.on("message", (task: CommandLineTask) => {

	const _script: string = task.command + " " + task.args.join(" ");

	const _command: ChildProcess = exec(_script, {
		cwd: task.directory,
		windowsHide: true
	});

	if (task.output)
		_command.stdout?.on("data", chunk => _messageHandler("stdout", task.taskId, chunk));

	_command.stdout?.on("exit", code => _messageHandler("exit", task.taskId, code));

	_command.stdout?.on("close", () => _messageHandler("close", task.taskId));

	_command.stdout?.on("error", error => _messageHandler("error", task.taskId, error));
});
