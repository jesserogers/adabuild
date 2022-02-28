import { Inject, Injectable, OnInit } from "@kuroi/syringe";
import * as vscode from "vscode";
import { BuildService } from "../build";
import { ConfigurationService } from "../config";
import { Monitor } from "../monitor";

/**
 * @author Jesse Rogers <jesse.rogers@adaptiva.com>
 * @description Main application logic behind adabuild VS Code extension
 */
@Injectable({
	scope: "global"
})
export class AdaBuildExtension implements OnInit {

	constructor(
		@Inject(Monitor) private monitor?: Monitor,
		@Inject(BuildService) private builder?: BuildService,
		@Inject(ConfigurationService) private config?: ConfigurationService
	) {

	}

	onInit(): void {
		this.config?.loadConfiguration().then(() => {
			this.monitor?.start();
		});
	}

	public generateCommands(): vscode.Disposable[] {
		return [
			// normal build command
			vscode.commands.registerCommand(`adabuild.build`, () => {
				this.builder?.build();
			}),
			// incremental build command
			vscode.commands.registerCommand(`adabuild.incrementalbuild`, () => {
				this.builder?.build(true);
			}),
			// tsconfig dev command
			vscode.commands.registerCommand(`adabuild.copytsconfigdev`, () => {
				this.config?.copyTsConfigDev();
			}),
			// tsconfig dev command
			vscode.commands.registerCommand(`adabuild.copytsconfigprod`, () => {
				this.config?.copyTsConfigProd();
			}),
		];
	}

}