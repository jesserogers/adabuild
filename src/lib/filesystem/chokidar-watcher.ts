import { FSWatcher } from "chokidar";
import { IWatcher } from "../../lib";
import { ChokidarEventListenerCallback } from "./chokidar-event-listener-callback.type";
import { ChokidarEventListener } from "./chokidar-event-listener.type";

/**
 * @author Jesse Rogers <jesse.rogers@adaptiva.com>
 * @description Exposes listeners for Chokidar events of interest
 */
export class ChokidarWatcher implements IWatcher<ChokidarEventListener> {

	public onDidChange: ChokidarEventListener;
	
	public onDidCreate: ChokidarEventListener;
	
	public onDidDelete: ChokidarEventListener;

	constructor(
		public watcher: FSWatcher,
		public onDispose?: () => void
	) {
		this.onDidChange = (callback: ChokidarEventListenerCallback) => {
			watcher.on("change", callback);
			return {
				dispose(): void {
					watcher.off("change", callback);
				}
			};
		};
		this.onDidCreate = (callback: ChokidarEventListenerCallback) => {
			watcher.on("add", callback);
			return {
				dispose(): void {
					watcher.off("add", callback);
				}
			};
		};
		this.onDidDelete = (callback: ChokidarEventListenerCallback) => {
			watcher.on("unlink", callback);
			return {
				dispose(): void {
					watcher.off("unlink", callback);
				}
			};
		};
	}

	public dispose(): void {
		if (this.onDispose)
			this.onDispose();
	}

}