# adabuild
`adabuild` is a custom VS Code extension for the Adaptiva Front End Engineering team to streamline build processes. This extension provides an embedded application that monitors changes to Angular projects, allowing developers to confidently build only changed code before compiling a full application.

## Features
 - `Build`: Automatically compiles project dependencies before compiling the requested project
 - `Build (Incremental)`: Compiles project dependencies but skips those unchanged since their last recorded build
 - `Build All Projects`: Compiles all projects without regard for incrementation. Only compiles each project once.
 - `Debug Application`: Runs a debuggable instance of an `application` type project.
 - `Set TS Config (DEV)`: Copies `tsconfig.dev.json` over `tsconfig.json`
 - `Set TS Config (PROD)`: Copies `tsconfig.prod.json` over `tsconfig.json`
 - `Build Server Jar`: Runs the `buildServerJar.bat` process
 - `Build Client Jar`: Runs the `buildClientJar.bat` process

## Requirements

### Configuration
Your project _must_ have a `adabuild.config.json` file in the project root. This file needs to follow the `IBuildConfig` interface as a schema. Make sure to provide a glob pattern to your projects directory (or whatever it's called) and List your `projectDefinitions` _in order_ of dependency.

Each `projectDefinition` has an optional `buildCommand` and `debugCommand` value for which you can supply a custom command line string to execute your build process. If none provided, `adabuild` will default to `ng build {project-name}`.

### System
Adaptiva's UI build process is quite memory intensive at this point. Our references to Node are generally configured to allot significant resources, but your system itself may not know how much memory Node needs in the context of `adabuild`.

Set global environment variables for `NODE_OPTIONS` to include `--max-old-space-size`.

#### Windows cmd
```
set NODE_OPTIONS=--max-old-space-size=8192
```

#### Bash
```
export NODE_OPTIONS=--max-old-space-size=8192
```

## Usage

### CLI
 1. Drop the `adabuild` application directory into an easily accessible folder on your development machine. Anywhere under your `C:` drive is fine.
 2. Add this directory to your `PATH`.
 3. Open the `CloudFramework` folder in a `cmd` prompt (admin is not a bad idea) and enter `adabuild run` to start the app.
 4. The `adabuild` Node process should now be running in the background, watching `CloudFramework` for changes.
 5. Run `build {project}` to initiate a build, or `reset {project?}` to clear its history.

### VS Code
 1. Copy the `.vsix` file for `adabuild` into your machine somewhere.
 2. Open VS Code and navigate to the "Extensions" tab.
 3. Find the extensions menu and select "Install from .VSIX"
 4. Install the extension and wait for it to activate. You should see a message in the output channel when activation is complete.
 5. Access `adabuild` features through the VS Code Command Palette (`shift + ctrl + P`)

**Note**: It's probably not a good idea to have the CLI running alongside the VS Code extension! I recommend choosing one or the other, depending on your tooling preferences.