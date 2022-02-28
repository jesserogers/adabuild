export interface IQueueEntry<T> {
	value: T;
	next?: IQueueEntry<T>;
	previous?: IQueueEntry<T>;
}