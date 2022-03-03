import { Injectable } from "@kuroi/syringe";
import { BaseLoggingService } from "../../common";

@Injectable({
	scope: "global"
})
export class CliLoggingService extends BaseLoggingService {

	error(method: string, ...args: any[]): void {
		console.warn(`adabuild [ERROR] - ${method} - ${this._getTimeStamp()}:`, ...args);
	}

	info(method: string, ...args: any[]): void {
		console.log(`adabuild [INFO] - ${method} - ${this._getTimeStamp()}:`, ...args);
	}

	log(method: string, ...args: any[]): void {
		console.warn(`adabuild [LOG] - ${method} - ${this._getTimeStamp()}:`, ...args);
	}

	warn(method: string, ...args: any[]): void {
		console.warn(`adabuild [WARN] - ${method} - ${this._getTimeStamp()}:`, ...args);
	}

}