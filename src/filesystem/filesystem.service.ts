import { Inject, Injectable } from "@kuroi/syringe";
import { TextDecoder, TextEncoder } from "util";
import * as vscode from "vscode";

/**
 * @author Jesse Rogers <jesse.rogers@adaptiva.com>
 * @description Singleton service for VS Code filesystem API
 */
@Injectable({
	scope: "global"
})
export class FileSystemService {

	private _root: string = "";

	get root(): string {
		if (vscode.workspace.workspaceFolders)
			this._root = vscode.workspace.workspaceFolders[0].uri.fsPath;

		return this._root || "";
	}

	constructor(
		@Inject(TextDecoder) private decoder: TextDecoder,
		@Inject(TextEncoder) private encoder: TextEncoder
	) {

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

	public copyFile(source: string, destination: string): Promise<boolean> {
		const _sourceUri = vscode.Uri.file(source);
		const _destinationUri = vscode.Uri.file(destination);
		return new Promise(resolve => vscode.workspace.fs.copy(_sourceUri, _destinationUri, {
			overwrite: true
		}).then(
			() => {
				resolve(true);
			},
			_error => {
				resolve(false);
			}
		));
	}

	public writeFile(path: string, content: string | Object): Promise<void> {
		if (!path)
			return Promise.reject("Invalid path: " + path);

		if (!content)
			return Promise.reject("No content supplied");

		if (typeof content !== "string")
			content = JSON.stringify(content);

		return new Promise((resolve, reject) => {
			vscode.workspace.fs.writeFile(
				vscode.Uri.file(path),
				this.encoder.encode(content as string)
			).then(
				() => {
					resolve(void 0);
				},
				_err => {
					reject(_err);
				}
			);
		});
	}

}