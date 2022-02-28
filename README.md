# adabuild
`adabuild` is a custom VS Code extension for the Adaptiva Front End Engineering team to streamline their Angular build processes.

## Features
VS Code extension commands to compile Angular projects and any peer dependencies within the local projects directory.
 - `Build`: Automatically compiles project dependencies before compiling the requested project
 - `Build (Incremental)`: Compiles project dependencies but skips those unchanged since their last recorded build
 - `Build All Projects`: Compiles all projects without regard for incrementation. Only compiles each project once.
 - `Debug Application`: Runs a debuggable instance of an `application` type project.
 - `Set TS Config (DEV)`: Copies `tsconfig.dev.json` over `tsconfig.json`
 - `Set TS Config (PROD)`: Copies `tsconfig.prod.json` over `tsconfig.json`
 - `Build Server Jar`: Runs the `buildServerJar.bat` process
 - `Build Client Jar`: Runs the `buildClientJar.bat` process

## Requirements
Your project _must_ have a `adabuild.config.json` file in the project root. This file needs to follow the `IBuildConfig` interface as a schema. Make sure to provide a glob pattern to your projects directory (or whatever it's called) and List your `projectDefinitions` _in order_ of dependency.

Each `projectDefinition` has an optional `buildCommand` and `debugCommand` value for which you can supply a custom command line string to execute your build process. If none provided, `adabuild` will default to `ng build {project-name} --c production`.
