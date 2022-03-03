export interface BaseLoggingService {
	info(method: string, ...args: any[]): void;
	warn(method: string, ...args: any[]): void;
	error(method: string, ...args: any[]): void;
	log(method: string, ...args: any[]): void;
}

export abstract class BaseLoggingService implements BaseLoggingService {

	protected _getTimeStamp(): string {
		return new Date().toLocaleString();
	}

}