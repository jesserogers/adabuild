import { IDisposable } from "../../common";
import { ChokidarEventListenerCallback } from "./chokidar-event-listener-callback.type";

export type ChokidarEventListener = (callback: ChokidarEventListenerCallback) => IDisposable;