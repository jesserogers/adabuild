import { IQueueEntry } from "./queue-entry.interface";

export class Queue<T> {

	public count: number = 0;

	protected _start?: IQueueEntry<T>;

	protected _end?: IQueueEntry<T>;

	constructor(public max: number = 0) {
		if (this.max < 0)
			this.max = 0;
	}

	public dequeue(): T | null {
		if (this._start) {
			const _value = this._start.value;
			this._start = this._start.next;
			this.count--;
			return _value;
		}
		return null;
	}

	public enqueue(...values: T[]): boolean {
		for (let i = 0; i < values.length; i++) {
			if (!this._enqueue(values[i]))
				return false;
		}
		return true;
	}

	public peek(): T | null {
		return this._start?.value || null;
	}

	private _enqueue(value: T): boolean {
		if (this.max && this.count >= this.max) {
			return false;
		}
		const _entry: IQueueEntry<T> = { value };
		if (this._start) {
			if (!this._end) {
				this._end = _entry;
				this._start.next = this._end;
			} else {
				this._end.next = _entry;
				this._end = _entry;
			}
		} else {
			this._start = _entry;
		}
		
		this.count++;
		return true;
	}

}