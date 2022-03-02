export interface BaseCommandLineService {
	exec(command: string, directory: string): void;
}

export abstract class BaseCommandLineService implements BaseCommandLineService {

}