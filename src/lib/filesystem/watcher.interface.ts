import { IDisposable } from "../utils";

export interface IWatcher<T> extends IDisposable {
	onDidCreate: T;
	onDidChange: T;
	onDidDelete: T;
}