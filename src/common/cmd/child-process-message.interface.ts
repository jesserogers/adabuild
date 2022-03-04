export interface IChildProcessMessage<T = any> {
	type: string;
	taskId: string;
	value: T,
	out?: string;
}