import { Inject, Injectable } from "@kuroi/syringe";
import { TextDecoder } from "util";
import * as vscode from "vscode";

/**
 * @author Jesse Rogers <jesse.rogers@adaptiva.com>
 * @description Singleton service for VS Code filesystem API
 */
@Injectable({
	scope: "global"
})
export class FileSystemService {

	constructor(@Inject(TextDecoder) private decoder: TextDecoder) {

	}

	public watch(glob: vscode.GlobPattern): vscode.FileSystemWatcher {
		return vscode.workspace.createFileSystemWatcher(glob);
	}

	public getJsonFile<T>(path: string): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			vscode.workspace.fs.readFile(vscode.Uri.file(path)).then(
				_bytes => {
					if (!_bytes || !_bytes.length)
						return reject("Unable to locate file at " + path);

					try {
						return resolve(JSON.parse(this.decoder.decode(_bytes)) as T);
					} catch (_err) {
						console.error(_err);
						return reject("Failed to parse file at " + path);
					}
				},
				_error => {
					console.error(_error);
					return reject(_error);
				}
			);
		});
	}

	public getDirectory(path: string): Promise<[string, vscode.FileType][]> {
		const _uri: vscode.Uri = vscode.Uri.file(path);
		return new Promise((resolve, reject) => {
			vscode.workspace.fs.readDirectory(_uri).then(
				_directory => resolve(_directory),
				_error => reject(_error)
			);
		});
	}

}