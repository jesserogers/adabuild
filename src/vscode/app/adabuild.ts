import * as vscode from "vscode";

export class adabuild {

	public terminal!: vscode.Terminal | null;

	private _projectName: string = "";

	private _running: boolean = false;

	private get root(): string {
		if (vscode.workspace?.workspaceFolders && vscode.workspace?.workspaceFolders[0])
			return vscode.workspace.workspaceFolders[0].uri.path;

		return "";
	}

	constructor() {
		this._findExistingTerminal();
	}

	public generateCommands(): vscode.Disposable[] {
		return [
			vscode.commands.registerCommand("adabuild.start", () => this.start()),
			vscode.commands.registerCommand("adabuild.stop", () => this.stop()),
			vscode.commands.registerCommand("adabuild.build", () => this.build(true)),
			vscode.commands.registerCommand("adabuild.buildfull", () => this.build(false)),
			vscode.commands.registerCommand("adabuild.buildall", () => this.buildAll(true)),
			vscode.commands.registerCommand("adabuild.buildallfull", () => this.buildAll(false)),
			vscode.commands.registerCommand("adabuild.reset", () => this.reset()),
			vscode.commands.registerCommand("adabuild.copytsconfigdev", () => this.copyTsConfig("dev")),
			vscode.commands.registerCommand("adabuild.copytsconfigprod", () => this.copyTsConfig("prod"))
		];
	}

	public start(): void {
		if (this._running) {
			vscode.window.showWarningMessage("[adabuild] adabuild is already running.");
			return;
		}

		this._execute("adabuild start");
		this._running = true;
	}

	public stop(): void {
		if (!this._running) {
			vscode.window.showErrorMessage("[adabuild] adabuild process not running!");
			return;
		}
		this._execute("stop");
		this._running = false;
	}

	public build(_incremental: boolean = true): void {
		if (!this._running) {
			vscode.window.showErrorMessage("[adabuild] adabuild process not running!");
			return;
		}
		vscode.window.showInputBox({
			value: this._projectName,
			placeHolder: "Enter project name"
		}).then(
			_project => {
				this._projectName = _project || "";

				if (!this._projectName)
					return;

				const _command: string = "build " + this._projectName + (!_incremental ? "--incremental false" : "");
				this._execute(_command);
			},
			_error => {
				vscode.window.showErrorMessage("[adabuild] Unexpected error requesting project name: " + _error);
			}
		);
	}

	public buildAll(_incremental: boolean = true): void {
		if (!this._running) {
			vscode.window.showErrorMessage("[adabuild] adabuild process not running!");
			return;
		}

		const _command: string = "build all " + (!_incremental ? " --incremental false" : "");
		this._execute(_command);
	}

	public reset(): void {
		if (!this._running) {
			vscode.window.showErrorMessage("[adabuild] adabuild process not running!");
			return;
		}
		this._execute("reset");
	}

	public copyTsConfig(_env: string): void {
		const _source: vscode.Uri = vscode.Uri.file(`${this.root}/tsconfig.${_env}.json`);
		const _destination: vscode.Uri = vscode.Uri.file(`${this.root}/tsconfig.json`);
		vscode.workspace.fs.copy(_source, _destination, { overwrite: true });
	}

	private _findExistingTerminal(): void {
		const _terminal: vscode.Terminal | undefined = vscode.window.terminals.find(
			_terminal => _terminal.name === "adabuild");

		this.terminal = _terminal || null;
	}

	private _createTerminal(): void {
		this.terminal = vscode.window.createTerminal("adabuild");
	}

	private _execute(_command: string): void {
		if (!this.terminal) {
			this._createTerminal();
			vscode.window.onDidCloseTerminal(_terminal => {
				if (_terminal.name === "adabuild") {
					this.terminal = null;
					this._running = false;
				}
			});
		}

		this.terminal?.sendText(_command);
		this.terminal?.show();
	}

}