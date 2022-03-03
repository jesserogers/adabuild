import { Injectable } from "@kuroi/syringe";
import * as vscode from "vscode";
import { APP_NAME, BaseLoggingService } from "../../common";

/**
 * @author Jesse Rogers <jesse.rogers@adaptiva.com>
 * @description Shortcut Service for VS Code's Window API
 */
@Injectable({
	scope: "global"
})
export class WindowService extends BaseLoggingService {

	public inputBox = vscode.window.showInputBox;

	private _outputChannel!: vscode.OutputChannel;

	public info(method: string, message: string): void {
		this._outputChannel.appendLine(`${APP_NAME}.${method} - [LOG]  - ${this._getTimeStamp()} - ${message}`);
		vscode.window.showInformationMessage(`adabuild [INFO] ${message}`);
	}

	public warn(method: string, message: string): void {
		this._outputChannel.appendLine(`${APP_NAME}.${method} - [WARN] - ${this._getTimeStamp()} - ${message}`);
		vscode.window.showWarningMessage(`adabuild [WARN] - ${this._getTimeStamp()} - ${message}`);
	}

	public error(method: string, message: string): void {
		this._outputChannel.appendLine(`${APP_NAME}.${method} - [ERROR] - ${this._getTimeStamp()} - ${message}`);
		vscode.window.showErrorMessage(`adabuild [ERROR] - ${this._getTimeStamp()} - ${message}`);
	}

	public log(method: string, message: string): void {
		if (!this._outputChannel) {
			this._outputChannel = vscode.window.createOutputChannel(APP_NAME);
			this._outputChannel.show();
		}
		this._outputChannel.appendLine(`${APP_NAME}.${method} [LOG] - ${this._getTimeStamp()} - ${message}`);
	}

}