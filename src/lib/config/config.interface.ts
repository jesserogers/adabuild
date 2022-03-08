import { IProjectDefinition } from "./project-definition.interface";

export interface IBuildConfig {
	projectsRootGlob: string;
	projectDefinitions: IProjectDefinition[];
	maxConcurrentBuilds?: number;
	prebuild?: string;
	postbuild?: string;
}