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

	public inputBox = vscode.window.showInputBox;

	private _outputChannel!: vscode.OutputChannel;

	public info(message: string): void {
		vscode.window.showInformationMessage(`adabuild: ${message}`);
	}

	public warn(message: string): void {
		vscode.window.showWarningMessage(`adabuild: ${message}`);
	}

	public error(message: string): void {
		vscode.window.showErrorMessage(`adabuild: ${message}`);
	}

	public log(message: string): void {
		if (!this._outputChannel) {
			this._outputChannel = vscode.window.createOutputChannel(APP_NAME);
			this._outputChannel.show();
		}
		this._outputChannel.appendLine(`[${APP_NAME}]: ${message}`);
	}


}