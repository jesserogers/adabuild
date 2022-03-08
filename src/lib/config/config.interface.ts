import { IProjectDefinition } from "./project-definition.interface";

export interface IBuildConfig {
	maxConcurrentBuilds: number;
	projectsRootGlob: string;
	projectDefinitions: IProjectDefinition[];
	prebuild?: string;
	postbuild?: string;
}