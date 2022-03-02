export interface BaseLoggingService {
	info(message: string): void;
	warn(message: string): void;
	error(message: string): void;
	log(message: string): void;
}

export abstract class BaseLoggingService implements BaseLoggingService {

}