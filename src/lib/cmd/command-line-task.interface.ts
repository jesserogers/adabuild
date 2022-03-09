import { v4 as uuidv4 } from "uuid";

export interface CommandLineTask {
	args: string[];
	command: string;
	delay?: number;
	directory?: string;
	output?: boolean;
	taskId?: string;
	forceClose?: boolean;
	onOutput?: (output: string) => void;
	hide?: boolean;
}

export class CommandLineTask implements CommandLineTask {
	constructor(task: CommandLineTask) {
		this.args = task.args;
		this.command = task.command;
		this.delay = task.delay || 0;
		this.directory = task.directory;
		this.output = task.output;
		this.taskId = task.taskId || uuidv4();
		this.onOutput = task.onOutput;
		this.forceClose = task.forceClose || false;
		this.hide = task.hide === undefined ? true : task.hide;
	}
}