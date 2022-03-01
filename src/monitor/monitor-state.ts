import { Inject, Injectable, OnInit } from "@kuroi/syringe";
import { FileSystemService } from "../filesystem";
import { WindowService } from "../window";
import { IMonitorState } from "./monitor-state.interface";
import { IMonitorStoredState } from "./monitor-stored-state.interface";
import { IMonitorHistory } from "./monitory-history.interface";

@Injectable()
export class MonitorState implements IMonitorState, OnInit {

	private static readonly FILE_NAME: string = ".adabuildstate";

	public changed: Set<string> = new Set();

	public history: IMonitorHistory = {};

	private get _statePath(): string {
		return this.fileSystem.root + "\\" + MonitorState.FILE_NAME;
	}

	constructor(
		@Inject(FileSystemService) private fileSystem: FileSystemService,
		@Inject(WindowService) private window: WindowService
	) {

	}

	onInit(): void {
		this._fetchPreviousState();
	}

	public record(project: string): void {
		this.history[project] = (this.history[project] || 0) + 1;
		this.changed.delete(project);
	}

	public clear(project?: string): void {
		if (!project) {
			this.changed.clear();
			this.history = {};
		} else {
			this.changed.delete(project);
			delete this.history[project];
		}
	}

	public save(): void {
		this.window.log(`Saving state to ${MonitorState.FILE_NAME}...`);
		this.fileSystem.writeFile(this._statePath, this.export());
	}

	public setChanged(changed: string[] | Set<string>) {
		this.changed = new Set(changed);
	}

	public setHistory(history: IMonitorHistory): void {
		this.history = history;
	}
	
	public hasChanged(project: string): boolean {
		return this.changed.has(project) || !this.history[project];
	}

	public change(project: string): void {
		this.changed.add(project);
	}

	public export(): string {
		return JSON.stringify({
			changed: Array.from(this.changed),
			history: this.history
		});
	}

	private _fetchPreviousState(): void {
		this.fileSystem.getJsonFile<IMonitorStoredState>(this._statePath).then(_state => {
			if (!_state)
				return;

			if (_state.changed)
				this.setChanged(_state.changed);

			if (_state.history)
				this.setHistory(_state.history);

		}).catch(_error => {
			this.window.log(_error);
		});
	}

}