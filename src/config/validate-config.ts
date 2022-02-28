import * as vscode from "vscode";
import { IBuildConfig } from "./config.interface";

export function validateConfig(config: IBuildConfig): boolean {
	if (!config)
		return false;

	if (!config.projectsRootGlob) {
		vscode.window.showErrorMessage("Invalid project root glob: " + config.projectsRootGlob);
		return false;
	}

	for (const _project of config.projectDefinitions) {
		if (!_project) {
			vscode.window.showErrorMessage("Invalid project: " + _project);
			return false;
		}
		if (!_project.name) {
			vscode.window.showErrorMessage("Invalid project name: " + _project.name);
			return false;
		}
		if (!["application", "library"].includes(_project.type)) {
			vscode.window.showErrorMessage("Invalid project type: " + _project.type);
			return false;
		}
	}

	return true;
	
}