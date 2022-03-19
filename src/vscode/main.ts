import { destroyAllInstances } from "@kuroi/syringe";
import { ExtensionContext } from 'vscode';
import { AdaBuildExtension } from "./app";

let adabuild: AdaBuildExtension;

export function activate(context: ExtensionContext) {
	try {
		adabuild = new AdaBuildExtension();
		context.subscriptions.push(...adabuild.generateCommands());
	} catch (_err) {
		console.error(_err);
	}
}

export function deactivate() {
	if (adabuild) {
		if (adabuild.terminal) {
			adabuild.terminal.dispose();
		}
	}
}
