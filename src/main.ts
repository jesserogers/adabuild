import { destroyAllInstances, inject } from "@kuroi/syringe";
import { TextDecoder } from "util";
import * as vscode from 'vscode';
import { Builder } from './builder';

export function activate(context: vscode.ExtensionContext) {
	const adabuild: Builder = inject(Builder, {
		providers: [ TextDecoder ]
	});
	context.subscriptions.push(...adabuild.generateCommands());
}

export function deactivate() {
	destroyAllInstances();
}
