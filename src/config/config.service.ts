import { Inject, Injectable } from "@kuroi/syringe";
import { APP_NAME } from "../constants";
import { FileSystemService } from "../filesystem";
import { WindowService } from "../window";
import { IBuildConfig } from "./config.interface";
import { IProjectDefinition } from "./project-definition.interface";

/**
 * @author Jesse Rogers
 * @description Singleton service for managing configuration files
 */
@Injectable({
	scope: "global"
})
export class ConfigurationService {

	public buildConfig!: IBuildConfig;

	constructor(
		@Inject(FileSystemService) private fileSystem: FileSystemService,
		@Inject(WindowService) private window: WindowService
	) {

	}
	
	public loadConfiguration(): Promise<IBuildConfig> {
		if (this.buildConfig)
			return Promise.resolve(this.buildConfig);

		if (!this.fileSystem.root)
			return Promise.reject("Aborting startup! Unable to determine workspace project root.");

		const _configFileName: string = APP_NAME + ".config.json";
		const _configFilePath: string = this.fileSystem.root + "\\" + _configFileName;

		return this.fileSystem.getJsonFile<IBuildConfig>(_configFilePath).then(_config => {
			if (!this._validateBuildConfig(_config)) {
				console.error("Invalid config", _config);
				this.window.error("Invalid config file");
				throw new Error(_configFileName + " failed validation");
			}
			this.buildConfig = _config;
			return _config;
		});
	}

	public getProject(name: string): IProjectDefinition | undefined {
		return this.buildConfig?.projectDefinitions.find(_project =>
			_project.name === name
		);
	}

	public copyTsConfigDev(): Promise<void> {
		return this.fileSystem.copyFile(
			this.fileSystem.root + "\\tsconfig.dev.json",
			this.fileSystem.root + "\\tsconfig.json"
		).catch(
			_error => {
				this.window.error("Failed to copy tsconfig.dev.json");
			}
		);
	}

	public copyTsConfigProd(): Promise<void> {
		return this.fileSystem.copyFile(
			this.fileSystem.root + "\\tsconfig.prod.json",
			this.fileSystem.root + "\\tsconfig.json"
		).catch(
			_error => {
				console.error(_error);
				this.window.error("Failed to copy tsconfig.prod.json");
			}
		);
	}

	private _validateBuildConfig(config: IBuildConfig): boolean {
		if (!config)
			return false;
	
		if (!config.projectsRootGlob) {
			this.window.error("Invalid project root glob: " + config.projectsRootGlob);
			return false;
		}
	
		for (const _project of config.projectDefinitions) {
			if (!_project) {
				this.window.error("Invalid project: " + _project);
				return false;
			}
			if (!_project.name) {
				this.window.error("Invalid project name: " + _project.name);
				return false;
			}
			if (!["application", "library"].includes(_project.type)) {
				this.window.error("Invalid project type: " + _project.type);
				return false;
			}
		}
	
		return true;
		
	}

}
