import { randomUUID } from "crypto";

export interface CommandLineTask {
	args: string[];
	command: string;
	directory?: string;
	output?: boolean;
	taskId?: string;
}

export class CommandLineTask implements CommandLineTask {
	constructor(task: CommandLineTask) {
		this.args = task.args;
		this.command = task.command;
		this.directory = task.directory;
		this.output = task.output;
		this.taskId = task.taskId || randomUUID()
	}
}