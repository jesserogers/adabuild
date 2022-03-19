import * as vscode from "vscode";

export class AdaBuildExtension{

	public terminal!: vscode.Terminal;

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
		if (!this.terminal) {
			this.terminal = vscode.window.createTerminal("adabuild");
			this._execute("adabuild run");
		}
	}

	public stop(): void {
		if (this.terminal)
			this.terminal.sendText("stop");
		else
			vscode.window.showErrorMessage("[adabuild] No terminal instance!");
	}

	public start(): void {
		if (this.terminal)
			this.terminal.sendText("start");
		else
			vscode.window.showErrorMessage("[adabuild] No terminal instance!");
	}

	public build(): void {
		vscode.window.showInputBox({
			value: this._projectName,
			placeHolder: "Enter project name"
		}).then(
			_project => {
				this._projectName = _project || "";
				if (this.terminal)
					this.terminal.sendText("build " + this._projectName);
			},
			_error => {
				vscode.window.showErrorMessage("[adabuild] Unexpected error requesting project name: " + _error);
			}
		);
	}

	public reset(): void {
		if (this.terminal)
			this.terminal.sendText("reset");
		else
			vscode.window.showErrorMessage("[adabuild] No terminal instance!");
	}

	private _findExistingTerminal(): void {
		const _terminal: vscode.Terminal | undefined = vscode.window.terminals.find(_terminal =>
			_terminal.name === "adabuild");

		if (_terminal)
			this.terminal = _terminal;
	}

	private _execute(_command: string): void {
		this.terminal.sendText(_command);
		this.terminal.show();
	}

}