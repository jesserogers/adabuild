import { performance } from 'perf_hooks'

export class Benchmark {

	private _start: number = 0;

	constructor() {
		this.start();
	}

	public start(): void {
		this._start = performance.now();
	}

	public elapsed(): number {
		const end = performance.now();
		return end - this._start;
	}

	public toString(): string {
		const _iso = new Date(this.elapsed()).toISOString();
		return _iso.substring(11, _iso.length - 5);
	}

}