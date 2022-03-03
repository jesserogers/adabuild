import { randomUUID } from "crypto";

export interface CommandLineTask {
	args: string[];
	command: string;
	delay?: number;
	directory?: string;
	output?: boolean;
	taskId?: string;
}

export class CommandLineTask implements CommandLineTask {
	constructor(task: CommandLineTask) {
		this.args = task.args;
		this.command = task.command;
		this.delay = task.delay || 0;
		this.directory = task.directory;
		this.output = task.output;
		this.taskId = task.taskId || randomUUID();
	}
}