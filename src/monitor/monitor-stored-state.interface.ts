import { IMonitorHistory } from "./monitory-history.interface";

export interface IMonitorStoredState {
	changed: string[];
	history: IMonitorHistory;
}