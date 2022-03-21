# adabuild
`adabuild` is a custom application for the Adaptiva Front End Engineering team to streamline build processes. This tool monitors changes to Angular projects, allowing developers to confidently build only changed code before compiling a full application.

## Requirements

### Configuration
Your project _must_ have a `adabuild.config.json` file in the project root. This file needs to follow the `IBuildConfig` interface as a schema. Make sure to provide a glob pattern to your projects directory (or whatever it's called) and list your `projectDefinitions` _in order_ of dependency.

Each `projectDefinition` has an optional `buildCommand` value for which you can supply a custom command line string to execute your build/debug process. If none provided, `adabuild` will default to `ng build {project-name}`.

### System
Adaptiva's UI build process is quite memory intensive at this point. Our references to Node are generally configured to allot significant resources, but your system may not know how much memory Node needs in the context of `adabuild`.

Set global environment variables for `NODE_OPTIONS` to include `--max-old-space-size`.

#### Windows cmd
```
set NODE_OPTIONS=--max-old-space-size={YOUR_SIZE_HERE}
```

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
 5. Commands:  `build`, `reset`, `stop`, `start`, `cls`
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
  - `stop`
   - Stops file watching and kills any running child processes.
  - `cls`
   - Clears terminal output.

**Note**: The `adabuild` CLI is targeted to `win-x64` and as such does not always play nice in a `bash` terminal. Use `cmd` prompt for best results.

### VS Code Extension
The `adabuild` VS Code Extension exposes shortcuts in the VS Code Command Palette to invoke the `adabuild` CLI. For best results, set your default shell profile to `"Command Prompt"` in your VS Code settings.

 1. Navigate to the **Extensions** tab in VS Code.
 2. Select the "Install from VSIX" menu item from the Extensions tab context menu.
 3. Select the `adabuild-... .vsix` file and wait for it to activate.
