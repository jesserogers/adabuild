import { Injectable, OnInit } from "@kuroi/syringe";
import * as vscode from "vscode";

/**
 * @author Jesse Rogers <jesse.rogers@adaptiva.com>
 * @description Provides a simplified interface to VS Code's terminal execution API
 */
@Injectable({
	scope: "global"
})
export class CommandLineService implements OnInit {

	private static readonly TERMINAL_NAME: string = "adabuild";

	private _terminal!: vscode.Terminal;

	onInit(): void {
		for (const _terminal of vscode.window.terminals) {
			if (_terminal.name === CommandLineService.TERMINAL_NAME) {
				this._terminal = _terminal;
				break;
			}
		}
	}

	public exec(command: string, directory?: string): vscode.Terminal {
		if (!this._terminal) {
			this._terminal = vscode.window.createTerminal({
				name: "adabuild",
				cwd: directory
			});
		}
		this._terminal.show();
		this._terminal.sendText(command);
		return this._terminal;
	}

}