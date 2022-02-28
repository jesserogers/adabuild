import { destroyAllInstances, inject } from "@kuroi/syringe";
import { TextDecoder } from "util";
import * as vscode from 'vscode';
import { BuildService } from './build';

export function activate(context: vscode.ExtensionContext) {
	const adabuild: BuildService = inject(BuildService, {
		providers: [ TextDecoder ]
	});
	context.subscriptions.push(...adabuild.generateCommands());
}

export function deactivate() {
	destroyAllInstances();
}
