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

	public info(_method: string, message: string): void {
		this._outputChannel.appendLine(`${APP_NAME} [LOG] - ${this._getTimeStamp()} - ${message}`);
		vscode.window.showInformationMessage(`[adabuild] ${message}`);
	}

	public warn(_method: string, message: string): void {
		this._outputChannel.appendLine(`${APP_NAME} [WARN] - ${this._getTimeStamp()} - ${message}`);
		vscode.window.showWarningMessage(`[adabuild] ${message}`);
	}

	public error(_method: string, message: string): void {
		this._outputChannel.appendLine(`${APP_NAME} [ERROR] - ${this._getTimeStamp()} - ${message}`);
		vscode.window.showErrorMessage(`[adabuild] ${message}`);
	}

	public log(_method: string, message: string): void {
		if (!this._outputChannel) {
			this._outputChannel = vscode.window.createOutputChannel(APP_NAME);
			this._outputChannel.show();
		}
		this._outputChannel.appendLine(`${APP_NAME} [LOG] - ${this._getTimeStamp()} - ${message}`);
	}

}