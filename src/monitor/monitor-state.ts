import { IMonitorHistory } from "./monitory-history.interface";
import { IMonitorState } from "./monitor-state.interface";

export class MonitorState implements IMonitorState {

	public changed: string[];

	public history: IMonitorHistory;

	constructor(changed: Set<string>, history: Map<string, number>) {
		this.changed = Array.from(changed);
		this.history = {};
		history.forEach((_increment: number, _project: string) => {
			this.history[_project] = _increment;
		});
	}

	public export(): string {
		return JSON.stringify({
			changed: this.changed,
			history: this.history
		});
	}

}