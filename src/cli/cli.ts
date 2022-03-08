#!/usr/bin/env node
import { inject } from "@kuroi/syringe";
import * as process from "process";
import { TextDecoder } from "util";
import { BaseBuildService, BaseCommandLineService, BaseConfigurationService, BaseFileSystemService, BaseLoggingService, BaseMonitorService, BaseMonitorState, ChokidarService } from "../lib";
import { AdaBuildCli } from "./app";
import { CliBuildService } from "./build";
import { CliCommandLineService } from "./cmd";
import { CliConfigurationService } from "./config";
import { CliFileSystemService } from "./filesystem";
import { CliLoggingService } from "./logging/cli-logging.service";
import { CliMonitorService, CliMonitorState } from "./monitor";

const [ , , command, ...args]: string[] = process.argv;

const app: AdaBuildCli = inject(AdaBuildCli, {
	providers: [
		TextDecoder,
		ChokidarService,
		{
			for: BaseBuildService, provide: { use: CliBuildService }
		},
		{
			for: BaseCommandLineService, provide: { use: CliCommandLineService }
		},
		{
			for: BaseConfigurationService, provide: { use: CliConfigurationService }
		},
		{
			for: BaseFileSystemService, provide: { use: CliFileSystemService }
		},
		{
			for: BaseLoggingService, provide: { use: CliLoggingService }
		},
		{
			for: BaseMonitorState, provide: { use: CliMonitorState }
		},
		{
			for: BaseMonitorService, provide: { use: CliMonitorService }
		}
	]
});
app.parseCommand(command, ...args);