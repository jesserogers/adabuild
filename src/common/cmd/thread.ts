import { ChildProcess, spawn } from "child_process";
import * as process from "process";
import { CommandLineTask } from "./command-line-task.interface";

const messageHandler = (type: string, taskId?: string, value?: any): void => {
	process.send && process.send({ taskId, type, value });
};

process.on("message", (task: CommandLineTask) => {
	const _command: ChildProcess = spawn(task.command, task.args);
	
	_command.on("exit", code => messageHandler("exit", task.taskId, code));

	_command.on("error", error => messageHandler("error", task.taskId, error));

	if (task.output)
		_command.stdout?.on("data", chunk => messageHandler("stdout", task.taskId, chunk));

	_command.stdout?.on("exit", code => messageHandler("exit", task.taskId, code));

	_command.stdout?.on("close", () => messageHandler("close", task.taskId));

	_command.stdout?.on("error", error => messageHandler("error", task.taskId, error));
});
