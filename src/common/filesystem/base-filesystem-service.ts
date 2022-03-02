import { IWatcher } from "./watcher.interface";

export interface BaseFileSystemService {
	watch(glob: string): IWatcher<any>;
	getJsonFile<T>(path: string): Promise<T>;
	getDirectory(path: string): Promise<any>;
	copyFile(source: string, destination: string): Promise<boolean>;
	writeFile(path: string, content: string | Object): Promise<void>;
}

export abstract class BaseFileSystemService implements BaseFileSystemService {
	abstract get root(): string;
}