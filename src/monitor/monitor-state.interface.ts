import { IMonitorHistory } from "./monitory-history.interface";

export interface IMonitorState {
	changed: string[];
	history: IMonitorHistory;
}