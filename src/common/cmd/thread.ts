import { exec } from "child_process";
import * as process from "process";
import { CommandLineTask } from "./command-line-task.interface";

const _messageHandler = (type: string, taskId?: string, value?: any, out?: string): void => {
	process.send && process.send({ taskId, type, value, out });
};

let _outMessage: string;

process.on("message", (task: CommandLineTask) => {

	const _script: string = task.command + " " + task.args.join(" ");

	const _options = { cwd: task.directory, windowsHide: true };

	exec(_script, _options, (_error, _stdout, _stderr) => {
		if (_stdout) {
			_outMessage = _stderr;
			if (task.output)
				_messageHandler("stdout", task.taskId, _stdout);
		}
		if (_stderr)
			_outMessage = _stderr;

	}).on("close", _code => {
		if ((_code || 0) > 0)
			_messageHandler("error", task.taskId, _outMessage);
		else
			_messageHandler("exit", task.taskId, _code, _outMessage);
	}).on("error", _error => {
		_messageHandler("error", task.taskId, _outMessage);
	});
});
