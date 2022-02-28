import { Injectable } from "@kuroi/syringe";
import * as vscode from "vscode";

/**
 * @author Jesse Rogers <jesse.rogers@adaptiva.com>
 * @description Shortcut Service for VS Code's Window API
 */
@Injectable({
	scope: "global"
})
export class WindowService {

	public info = vscode.window.showInformationMessage;

	public warn = vscode.window.showWarningMessage;

	public error = vscode.window.showErrorMessage;

	public inputBox = vscode.window.showInputBox;

	private _outputChannel!: vscode.OutputChannel;

	public log(message: string): void {
		if (!this._outputChannel) {
			this._outputChannel = vscode.window.createOutputChannel("adabuild");
		}
		this._outputChannel.appendLine("[adabuild]: " + message);
		this._outputChannel.show();
	}


}