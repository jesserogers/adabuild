type DebouncedMethod = (...args: any[]) => void;

export function debounce(logic: DebouncedMethod, timeout: number): DebouncedMethod {
	let _timer: NodeJS.Timeout;
	return (...args: any[]) => {
		clearTimeout(_timer);
		_timer = setTimeout(() => {
			logic(...args);
		}, timeout);
	};
}