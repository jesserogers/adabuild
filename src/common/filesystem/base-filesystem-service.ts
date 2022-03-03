import { IWatcher } from "./watcher.interface";

export interface BaseFileSystemService {

}

export abstract class BaseFileSystemService implements BaseFileSystemService {
	abstract get root(): string;
	abstract watch(glob: string): IWatcher<any>;
	abstract readFile<T>(path: string, parse?: boolean): Promise<T>;
	abstract getDirectory(path: string): Promise<any>;
	abstract copyFile(source: string, destination: string): Promise<boolean>;
	abstract writeFile(path: string, content: string | Object): Promise<void>;
}