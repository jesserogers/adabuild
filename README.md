# adabuild
`adabuild` is a custom .NET application for the Adaptiva Front End Engineering team to streamline Angular build processes.

## Features
 - Incremental building: `adabuild` will not recompile projects that haven't changed.
   - `adabuild` will recursively register changes from dependencies for "application" level projects only.
 - Parallel build execution
   - `adabuild` can run Angular builds in parallel

## Usage

### CLI
 1. Drop the `adabuild` application directory into an easily accessible folder on your development machine. Anywhere under your `C:` drive is fine.
 2. Add this directory to your `PATH`.
 3. Open the `CloudFramework` folder in a `cmd` or `bash` prompt and enter `adabuild start` to start the app. Elevated permissions are not a bad idea here.
 4. The `adabuild` Node process should now be running in the background, watching `CloudFramework` for changes.
    - **Note**: `adabuild` will check the directory for changes on startup, so incremental builds work without the `start` command running in the background.
 5. Commands:
    - `start`:
      - Starts file watching process and awaits further CLI input.
    - `stop`:
      - Destroys all child processes and exits `adabuild` process.
    - `build [project]`:
      - Queues a project and any dependencies for compilation.
	  - Pass `all` as the project name to build all application level projects.
	  - Flags:
        - `--incremental`: `boolean`
          - If `true`, `adabuild` won't build projects that haven't changed since its last recorded build.
          - Default: `true`
        - `--output`: `boolean`
          - If `true`, `adabuild` redirects all standard out messages from child processes to the terminal.
          - Default: `false`
		- `--delay`: `int`
		  - The amount of milliseconds `adabuild` delays between initiating each concurrent build, in order to not overload `ngcc`.
		  - Default: `500`
		- `--configuration`: `string`
        - `--prebuild`: `boolean`
          - When set to `false`, `adabuild` will not execute the `configuration.preBuild` script.
        - `--postbuild`: `boolean`
          - When set to `false`, `adabuild` will not execute the `configuration.postBuild` script.
    - `reset [project?]`
      - Removes change and build history from `.adabuildstate` for a specified project. If no specified project, `adabuild` removes all history.
    - `cls`
      - Clears terminal output.
    - `config`
      - Set configuration values from the CLI.
      - Flags:
        - `--terminal`: `string`
          - Sets the desired command prompt to generate child processes. Accepts `bash` or `cmd.exe`
          - Default: `cmd.exe`
        - `--concurrency`: `int`
          - Sets the maximum number of projects `adabuild` will run in parallel. Bound between `0` and the number of CPU cores on the machine.
		  - Default: `5`
    - `version`
      - Returns the currently installed `adabuild` version

#### Recommended Bash Settings
```
export NODE_OPTIONS=--max-old-space-size=8192
```

**Note**: The `adabuild` CLI is targeted to `win-x64` and as such does not always play nice in a `bash` terminal. Use `cmd` prompt for best results.

### VS Code Extension
The `adabuild` VS Code Extension exposes shortcuts in the VS Code Command Palette to invoke the `adabuild` CLI. For best results, set your default shell profile to `"Command Prompt"` in your VS Code settings.

 1. Navigate to the Extensions tab in VS Code.
 2. Select "Install from VSIX" from the menu in the top right corner of the Extensions tab.
 3. Select the VSIX file from the `adabuild` application directory.
 4. Upon activation, run `adabuild` CLI commands directly from the VS Code Command Palette.
