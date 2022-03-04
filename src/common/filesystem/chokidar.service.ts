import * as Chokidar from "chokidar";
import { IWatcher } from "../../common";
import { ChokidarEventListener } from "./chokidar-event-listener.type";
import { ChokidarWatcher } from "./chokidar-watcher";

/**
 * Wrapper around Chokidar library for file watching
 */
export class ChokidarService {

	private _watchers: Map<string, IWatcher<ChokidarEventListener>> = new Map();

	/** Creates a watcher on a specified file path */
	public createWatcher(path: string): IWatcher<ChokidarEventListener> {
		const _fsWatcher: Chokidar.FSWatcher = Chokidar.watch(path, {
			ignoreInitial: true
		});
		const _watcher = new ChokidarWatcher(_fsWatcher, () => {
			this._watchers.delete(path);
		});
		this._watchers.set(path, _watcher);
		return _watcher;
	}

}