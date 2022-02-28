export interface IProjectDefinition {
	type: "application" | "library";
	name: string;
	dependencies: string[];
	buildCommand?: string;
	debugCommand?: string;
}