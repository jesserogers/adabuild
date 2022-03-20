import * as vscode from "vscode";

export class adabuild {

	public terminal!: vscode.Terminal | null;

	private _projectName: string = "";

	constructor() {
		this._findExistingTerminal();
	}

	public generateCommands(): vscode.Disposable[] {
		return [
			vscode.commands.registerCommand("adabuild.run", () => this.run()),
			vscode.commands.registerCommand("adabuild.stop", () => this.stop()),
			vscode.commands.registerCommand("adabuild.start", () => this.start()),
			vscode.commands.registerCommand("adabuild.build", () => this.build()),
			vscode.commands.registerCommand("adabuild.reset", () => this.reset()),
		];
	}

	public run(): void {
		this._execute("adabuild run");
	}

	public stop(): void {
		this._execute("stop");
	}

	public start(): void {
		this._execute("start");
	}

	public build(): void {
		vscode.window.showInputBox({
			value: this._projectName,
			placeHolder: "Enter project name"
		}).then(
			_project => {
				this._projectName = _project || "";
				this._execute("build " + this._projectName);
			},
			_error => {
				vscode.window.showErrorMessage("[adabuild] Unexpected error requesting project name: " + _error);
			}
		);
	}

	public reset(): void {
		this._execute("reset");
	}

	private _findExistingTerminal(): void {
		const _terminal: vscode.Terminal | undefined = vscode.window.terminals.find(_terminal =>
			_terminal.name === "adabuild");

		if (_terminal)
			this.terminal = _terminal;
	}

	private _createTerminal(): void {
		this.terminal = vscode.window.createTerminal("adabuild");
	}

	private _execute(_command: string): void {
		if (!this.terminal) {
			this._createTerminal();
			vscode.window.onDidCloseTerminal(_terminal => {
				if (_terminal.name === "adabuild")
					this.terminal = null;
			});
		}

		this.terminal?.sendText(_command);
		this.terminal?.show();
	}

}