import { APP_NAME } from "../constants";
import { BaseFileSystemService } from "../filesystem";
import { BaseLoggingService } from "../logging";
import { IBuildConfig } from "./config.interface";
import { IProjectDefinition } from "./project-definition.interface";

export abstract class BaseConfigurationService {

	public buildConfig!: IBuildConfig;

	private _projectMap: Map<string, IProjectDefinition> = new Map();

	constructor(
		protected fileSystem: BaseFileSystemService,
		protected logging: BaseLoggingService
	) {

	}

	/** Looks for `adabuild.config.json` in project root  */
	public loadConfiguration(): Promise<IBuildConfig> {
		if (this.buildConfig)
			return Promise.resolve(this.buildConfig);

		if (!this.fileSystem.root)
			return Promise.reject("Aborting startup! Unable to determine workspace project root.");

		const _configFileName: string = APP_NAME + ".config.json";
		const _configFilePath: string = this.fileSystem.root + "\\" + _configFileName;

		return this.fileSystem.readFile<IBuildConfig>(_configFilePath).then(_config => {
			if (!this._validateBuildConfig(_config)) {
				console.error("Invalid config", _config);
				this.logging.error("BaseConfigurationService.loadConfiguration", "Invalid config file");
				throw new Error(_configFileName + " failed validation");
			}
			this.buildConfig = _config;
			// store values in a map for quicker access
			this.buildConfig.projectDefinitions.forEach(_project =>
				this._projectMap.set(_project.name, _project)
			);
			return _config;
		});
	}

	/**
	 * Finds a project definition by name
	 */
	public getProject(name: string): IProjectDefinition | undefined {
		return this._projectMap.get(name);
	}

	/** Copies tsconfig.dev.json to tsconfig.json in project root */
	public copyTsConfigDev(): Promise<boolean> {
		return this.fileSystem.copyFile(
			this.fileSystem.root + "\\tsconfig.dev.json",
			this.fileSystem.root + "\\tsconfig.json"
		).catch(
			_error => {
				console.error(_error);
				this.logging.error("BaseConfigurationService.copyTsConfigDev", "Failed to copy tsconfig.dev.json");
				return false;
			}
		);
	}

	/** Copies tsconfig.prod.json to tsconfig.json in project root */
	public copyTsConfigProd(): Promise<boolean> {
		return this.fileSystem.copyFile(
			this.fileSystem.root + "\\tsconfig.prod.json",
			this.fileSystem.root + "\\tsconfig.json"
		).catch(
			_error => {
				console.error(_error);
				this.logging.error("BaseConfigurationService.copyTsConfigProd", "Failed to copy tsconfig.prod.json");
				return false;
			}
		);
	}

	private _validateBuildConfig(config: IBuildConfig): boolean {
		if (!config)
			return false;
	
		if (!config.projectsRootGlob) {
			this.logging.error("BaseConfigurationService._validateBuildConfig", "Invalid project root glob: " + config.projectsRootGlob);
			return false;
		}
	
		for (const _project of config.projectDefinitions) {
			if (!_project) {
				this.logging.error("BaseConfigurationService._validateBuildConfig", "Invalid project: " + _project);
				return false;
			}
			if (!_project.name) {
				this.logging.error("BaseConfigurationService._validateBuildConfig", "Invalid project name: " + _project.name);
				return false;
			}
			if (!["application", "library"].includes(_project.type)) {
				this.logging.error("BaseConfigurationService._validateBuildConfig", "Invalid project type: " + _project.type);
				return false;
			}
		}
	
		return true;
		
	}

}