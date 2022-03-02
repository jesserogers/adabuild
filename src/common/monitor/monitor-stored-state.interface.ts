import { IMonitorHistory } from "./monitor-history.interface";

export interface IMonitorStoredState {
	changed: string[];
	history: IMonitorHistory;
}