/**
 * @author Jesse Rogers <jesse.rogers@adaptiva.com>
 * @description Base class for logging application output in different execution contexts
 */
export abstract class BaseLoggingService {
	protected _getTimeStamp(): string {
		return new Date().toLocaleString();
	}
	abstract info(...args: any[]): void;
	abstract warn(...args: any[]): void;
	abstract error(...args: any[]): void;
	abstract log(...args: any[]): void;
}