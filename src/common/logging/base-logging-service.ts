export interface BaseLoggingService {

}

export abstract class BaseLoggingService implements BaseLoggingService {
	protected _getTimeStamp(): string {
		return new Date().toLocaleString();
	}
	abstract info(...args: any[]): void;
	abstract warn(...args: any[]): void;
	abstract error(...args: any[]): void;
	abstract log(...args: any[]): void;
}