import { destroyAllInstances, inject } from "@kuroi/syringe";
import { TextDecoder } from "util";
import { ExtensionContext } from 'vscode';
import { AdaBuildExtension } from "./app";

export function activate(context: ExtensionContext) {
	try {
		const adabuild: AdaBuildExtension = inject(AdaBuildExtension, {
			providers: [ TextDecoder ]
		});
		context.subscriptions.push(...adabuild.generateCommands());
	} catch (_err) {
		console.error(_err);
	}
}

export function deactivate() {
	destroyAllInstances();
}
