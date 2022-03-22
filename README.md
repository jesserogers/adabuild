# adabuild
`adabuild` is a custom VS Code extension for the Adaptiva Front End Engineering team to streamline their Angular build processes.

## Features
VS Code extension commands to compile Angular projects and any peer dependencies within the local projects directory.
 - `Build`: Automatically compiles project dependencies before compiling the requested project
 - `Build (Incremental)`: Compiles project dependencies but skips those unchanged since their last recorded build

#### Bash
```
export NODE_OPTIONS=--max-old-space-size={YOUR_SIZE_HERE}
```

## Usage

### CLI
 1. Drop the `adabuild` application directory into an easily accessible folder on your development machine. Anywhere under your `C:` drive is fine.
 2. Add this directory to your `PATH`.
 3. Open the `CloudFramework` folder in a `cmd` or `bash` prompt and enter `adabuild start` to start the app. Elevated permissions are not a bad idea here.
  - To take advantage of incremental builds, leave the app running in the background and let it watch for changes.
 4. The `adabuild` Node process should now be running in the background, watching `CloudFramework` for changes.
 5. Commands:
  - `start`:
   - Starts file watching process and awaits further CLI input.
  - `stop`
   - Destroys all child processes and exits `adabuild` process.
  - `build [project]`:
   - Queues a project and any dependencies for compilation.
   - `--incremental`: `boolean`
    - If `true`, `adabuild` won't build projects that haven't changed since its last recorded build.
    - Default: `true`
   - `--output`: `boolean`
    - If `true`, `adabuild` redirects all standard out messages from child processes to the terminal.
    - default: `false`
  - `reset [project?]`
   - Removes change and build history from `.adabuildstate` for a specified project. If no specified project, `adabuild` removes all history.
  - `cls`
   - Clears terminal output.

**Note**: The `adabuild` CLI is targeted to `win-x64` and as such does not always play nice in a `bash` terminal. Use `cmd` prompt for best results.

### VS Code Extension
The `adabuild` VS Code Extension exposes shortcuts in the VS Code Command Palette to invoke the `adabuild` CLI. For best results, set your default shell profile to `"Command Prompt"` in your VS Code settings.

 1. Navigate to the Extensions tab in VS Code.
 2. Select "Install from VSIX" from the menu in the top right corner of the Extensions tab.
 3. Select the VSIX file from the `adabuild` application directory.
 4. Upon activation, summon the command palette and run `adabuild: Start`.
