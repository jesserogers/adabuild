import { exec } from "child_process";
import * as process from "process";
import { CommandLineTask } from "./command-line-task.interface";

const _messageHandler = (type: string, taskId?: string, value?: any): void => {
	process.send && process.send({ taskId, type, value });
};

process.on("message", (task: CommandLineTask) => {

	const _script: string = task.command + " " + task.args.join(" ");

	const _options = { cwd: task.directory, windowsHide: true };

	exec(_script, _options, (_error, _stdout, _stderr) => {
		if (_stdout && task.output)
			_messageHandler("stdout", task.taskId, _stdout);
		if (_stderr)
			_messageHandler("error", task.taskId, _stderr);
	}).on("close", _code => {
		_messageHandler("exit", task.taskId, _code);
	});
});
