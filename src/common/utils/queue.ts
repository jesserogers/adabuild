interface Entry<T> {
	value?: T;
	next?: Entry<T>;
}

export class Queue<T> {

	private _start?: Entry<T>;

	private _end?: Entry<T>;

	public count = 0;

	public peek(): T | null {
		return this._start?.value || null;
	};

	public dequeue(): T | null {
		let _value = null;
		if (this._start) {
			_value = this._start.value;
			this._start = this._start.next;
			this.count--;
		}
		return _value || null;
	}

	public enqueue(value: T): void {
		const _entry: Entry<T> = { value };
		if (!this._start) {
			this._start = _entry;
			this._end = _entry;
		} else if (this._end) {
			this._end.next = _entry;
			this._end = _entry;
		}
		this.count++;
	}

}