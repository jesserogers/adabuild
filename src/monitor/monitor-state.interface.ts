import { IMonitorHistory } from "./monitory-history.interface";

export interface IMonitorState {
	changed: Set<string>;
	history: IMonitorHistory;
}