import { ExtensionContext } from 'vscode';
import { adabuild } from "./app";

let app: adabuild;

export function activate(context: ExtensionContext) {
	try {
		app = new adabuild();
		context.subscriptions.push(...app.generateCommands());
	} catch (_err) {
		console.error(_err);
	}
}

export function deactivate() {
	if (app) {
		if (app.terminal) {
			app.terminal.dispose();
		}
	}
}
