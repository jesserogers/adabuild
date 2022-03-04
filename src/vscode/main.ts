import { destroyAllInstances, inject } from "@kuroi/syringe";
import { TextDecoder } from "util";
import { ExtensionContext } from 'vscode';
import { BaseBuildService, BaseCommandLineService, BaseConfigurationService, BaseFileSystemService, BaseLoggingService, BaseMonitorService, BaseMonitorState, ChokidarService } from "../common";
import { AdaBuildExtension } from "./app";
import { BuildService } from "./build";
import { CommandLineService } from "./cmd";
import { ConfigurationService } from "./config";
import { FileSystemService } from "./filesystem";
import { MonitorService } from "./monitor";
import { MonitorState } from "./monitor/monitor-state";
import { WindowService } from "./window";

export function activate(context: ExtensionContext) {
	try {
		const adabuild: AdaBuildExtension = inject(AdaBuildExtension, {
			providers: [
				TextDecoder,
				ChokidarService,
				{
					for: BaseBuildService, provide: {
						use: BuildService
					}
				},
				{
					for: BaseMonitorService, provide: {
						use: MonitorService
					}
				},
				{
					for: BaseMonitorState, provide: {
						use: MonitorState
					}
				},
				{
					for: BaseCommandLineService, provide: {
						use: CommandLineService
					}
				},
				{
					for: BaseConfigurationService, provide: {
						use: ConfigurationService
					}
				},
				{
					for: BaseFileSystemService, provide: {
						use: FileSystemService
					}
				},
				{
					for: BaseLoggingService, provide: {
						use: WindowService
					}
				},
			]
		});
		context.subscriptions.push(...adabuild.generateCommands());
	} catch (_err) {
		console.error(_err);
	}
}

export function deactivate() {
	destroyAllInstances();
}
