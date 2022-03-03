import { Injectable } from "@kuroi/syringe";
import * as Chokidar from "chokidar";
import { IWatcher } from "../../common";
import { ChokidarEventListener } from "./chokidar-event-listener.type";
import { ChokidarWatcher } from "./chokidar-watcher";

@Injectable({
	scope: "global"
})
export class ChokidarService {

	private _watchers: Map<string, IWatcher<ChokidarEventListener>> = new Map();

	public createWatcher(path: string): IWatcher<ChokidarEventListener> {
		const _fsWatcher: Chokidar.FSWatcher = Chokidar.watch(path);
		const _watcher = new ChokidarWatcher(_fsWatcher, () => {
			this._watchers.delete(path);
		});
		this._watchers.set(path, _watcher);
		return _watcher;
	}

}