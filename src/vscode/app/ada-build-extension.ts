import { Inject, Injectable, OnInit } from "@kuroi/syringe";
import * as vscode from "vscode";
import { BaseBuildService, BaseConfigurationService, BaseLoggingService, BaseMonitorService } from "../../lib";
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
		@Inject(BaseMonitorService) private monitor: BaseMonitorService,
		@Inject(BaseBuildService) private builder: BaseBuildService,
		@Inject(BaseConfigurationService) private config: BaseConfigurationService,
		@Inject(BaseLoggingService) private window: WindowService
	) {

	}

	onInit(): void {
		this.config.loadConfiguration().then(() => {
			this.monitor.start();
			this.window.log("AdaBuildExtension.onInit", "Extension activated.");
		}).catch(_error => {
			this.window.error("AdaBuildExtension.onInit", _error);
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
			// debug app
			vscode.commands.registerCommand(`adabuild.debugapplication`, () => {
				this.builder.debugApplication();
			}),
			// tsconfig dev command
			vscode.commands.registerCommand(`adabuild.copytsconfigdev`, () => {
				this.config.copyTsConfigDev();
			}),
			// tsconfig prod command
			vscode.commands.registerCommand(`adabuild.copytsconfigprod`, () => {
				this.config.copyTsConfigProd();
			}),
			// reset
			vscode.commands.registerCommand(`adabuild.reset`, () => {
				this.window.inputBox({
					value: "",
					placeHolder: "Enter a comma separated list of projects to reset. Leave blank to reset all projects."
				}).then(_project => {
					const _projects: string[] = _project?.split(",")
						.map(x => x.trim())
						.filter(x => !!x) || [];

					this.monitor.reset(..._projects);
				});
			})
		];
	}

}