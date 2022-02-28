import { Injectable } from "@kuroi/syringe";
import * as vscode from "vscode";
import { APP_NAME } from "../constants";

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
			this._outputChannel = vscode.window.createOutputChannel(APP_NAME);
		}
		this._outputChannel.appendLine(`[${APP_NAME}]: ${message}`);
		this._outputChannel.show();
	}


}