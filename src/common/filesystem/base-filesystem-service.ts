import * as FileSystem from "fs";
import { BaseLoggingService } from "../logging";
import { ChokidarEventListener } from "./chokidar-event-listener.type";
import { ChokidarService } from "./chokidar.service";
import { IWatcher } from "./watcher.interface";

/**
 * @author Jesse Rogers <jesse.rogers@adaptiva.com>
 * @description Provides simplified APIs for interacting with the file system
 */
export abstract class BaseFileSystemService {

	abstract get root(): string;

	constructor(
		protected logging: BaseLoggingService,
		protected chokidar: ChokidarService
	) {

	}
	
	/** Get list of folders in a directory */
	getDirectory(path: string): Promise<any> {
		throw new Error("Method not implemented.");
	}
	
	/**
	 * Read file as a given object type
	 * @param parse set to false to read as string
	 */
	readFile<T>(path: string, parse: boolean = true): Promise<T> {
		return new Promise((resolve, reject) => {
			FileSystem.readFile(path, "utf-8", (err: NodeJS.ErrnoException | null, data: string) => {
				if (err) {
					console.error(err);
					reject(err.message);
				}
				try {
					if (parse)
						resolve(JSON.parse(data) as T);

					// return file content as string without parsing
					resolve(<any>data as T);
				} catch (_err) {
					reject(_err);
				}
			});
		});
	}
	
	/** Copy file from source path to destination path */
	copyFile(source: string, destination: string): Promise<boolean> {
		return this.readFile<any>(source).then(_content =>
			this.writeFile(destination, _content).then(() => true).catch(_err => {
				this.logging.error(_err);
				return false;
			})
		).catch(_err => {
			this.logging.error(_err);
			return false;
		});
	}
	
	/** Write content to file at a specified path */
	writeFile(path: string, content: string | Object): Promise<void> {
		if (typeof content === "object")
			content = JSON.stringify(content);
		
		return new Promise((resolve, reject) => {
			FileSystem.writeFile(path, content as string, (_err: any) => {
				if (_err)
					reject(_err);

				resolve(void 0);
			});
		});
	}

	/**
	 * Returns an `IWatcher` instance listening to a specified file path
	 */
	watch(glob: string): IWatcher<ChokidarEventListener> {
		return this.chokidar.createWatcher(glob);
	}

}