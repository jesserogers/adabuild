import { OnInit } from "@kuroi/syringe";
import { BaseFileSystemService } from "../filesystem";
import { BaseLoggingService } from "../logging";
import { IMonitorStoredState } from "./monitor-stored-state.interface";
import { IMonitorHistory } from "./monitor-history.interface";

/**
 * @author Jesse Rogers <jesse.rogers@adaptiva.com>
 * @description Stores state data for changed and built projects
 */
export abstract class BaseMonitorState implements OnInit {

	public changed: Set<string> = new Set();

	public history: IMonitorHistory = {};
	
	protected static readonly FILE_NAME: string = ".adabuildstate";

	get statePath(): string {
		return this.fileSystem.root + "\\" + BaseMonitorState.FILE_NAME;
	}

	constructor(
		protected fileSystem: BaseFileSystemService,
		protected logging: BaseLoggingService	
	) {

	}

	onInit(): void {
		this._fetchPreviousState();
	}

	/** Increments build history and removes from changed project list */
	public record(...projects: string[]): void {
		for (const project of projects) {
			this.history[project] = (this.history[project] || 0) + 1;
			this.changed.delete(project);
		}
		this.save();
	}

	/** Remove one or all projects from state */
	public clear(project?: string): void {
		if (!project) {
			this.changed.clear();
			this.history = {};
		} else {
			this.changed.delete(project);
			delete this.history[project];
		}
	}

	/** Write state to .adabuildstate file */
	public save(): void {
		this.logging.log("BaseMonitorState.save", `Saving state to ${BaseMonitorState.FILE_NAME}...`);
		this.fileSystem.writeFile(this.statePath, this.export());
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

	/** Returns current state as JSON */
	public export(): string {
		return JSON.stringify({
			changed: Array.from(this.changed),
			history: this.history
		});
	}

	private _fetchPreviousState(): void {
		this.fileSystem.readFile<IMonitorStoredState>(this.statePath).then(_state => {
			if (!_state)
				return;

			if (_state.changed)
				this.setChanged(_state.changed);

			if (_state.history)
				this.setHistory(_state.history);

		}).catch(_error => {
			this.logging.log(_error);
		});
	}
}