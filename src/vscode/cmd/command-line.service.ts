import { Injectable } from "@kuroi/syringe";
import * as vscode from "vscode";
import { APP_NAME } from "../../common";

/**
 * @author Jesse Rogers <jesse.rogers@adaptiva.com>
 * @description Provides a simplified interface to VS Code's terminal execution API
 */
@Injectable({
	scope: "global"
})
export class CommandLineService {

	private _terminal!: vscode.Terminal;

	public exec(command: string, directory?: string): vscode.Terminal {
		if (!this._terminal && !this._findPreviousTerminal()) {
			this._terminal = vscode.window.createTerminal({
				name: APP_NAME,
				cwd: directory
			});
		}
		this._terminal.show();
		this._terminal.sendText(command);
		return this._terminal;
	}

	private _findPreviousTerminal(): boolean {
		for (const _terminal of vscode.window.terminals) {
			if (_terminal.name === APP_NAME) {
				this._terminal = _terminal;
				return true;
			}
		}
		return false;
	}

}