import { Inject, Injectable, OnInit } from "@kuroi/syringe";
import * as vscode from "vscode";
import { BuildService } from "../build";
import { ConfigurationService } from "../config";
import { Monitor } from "../monitor";
import { WindowService } from "../window";

/**
 * @author Jesse Rogers <jesse.rogers@adaptiva.com>
 * @description Main application logic behind adabuild VS Code extension
 */
@Injectable({
	scope: "global"
})
export class AdaBuildExtension implements OnInit {

	constructor(
		@Inject(Monitor) private monitor: Monitor,
		@Inject(BuildService) private builder: BuildService,
		@Inject(ConfigurationService) private config: ConfigurationService,
		@Inject(WindowService) private window: WindowService
	) {

	}

	onInit(): void {
		this.config.loadConfiguration().then(() => {
			this.monitor.start();
			this.window.log("extension activated");
		});
	}

	public generateCommands(): vscode.Disposable[] {
		return [
			// normal build command
			vscode.commands.registerCommand(`adabuild.build`, () => {
				this.builder.build();
			}),
			// incremental build command
			vscode.commands.registerCommand(`adabuild.incrementalbuild`, () => {
				this.builder.build(true);
			}),
			// build all Angular projects
			vscode.commands.registerCommand(`adabuild.buildall`, () => {
				this.builder.buildAllProjects();
			}),
			// build server jar
			vscode.commands.registerCommand(`adabuild.buildserverjar`, () => {
				this.builder.buildServerJar();
			}),
			// build client jar
			vscode.commands.registerCommand(`adabuild.buildclientjar`, () => {
				this.builder.buildClientJar();
			}),
			// tsconfig dev command
			vscode.commands.registerCommand(`adabuild.copytsconfigdev`, () => {
				this.config.copyTsConfigDev();
			}),
			// tsconfig prod command
			vscode.commands.registerCommand(`adabuild.copytsconfigprod`, () => {
				this.config.copyTsConfigProd();
			})
		];
	}

}