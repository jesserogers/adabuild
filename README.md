# adabuild
`adabuild` is a custom VS Code extension for the Adaptiva Front End Engineering team to streamline their Angular build processes.

## Features
VS Code extension commands to compile Angular projects and any peer dependencies within the local projects directory.
 - `Build`: Automatically compiles project dependencies before compiling the requested project
 - `Build (Incremental)`: Compiles project dependencies but skips those unchanged since their last recorded build

## Requirements
Your project _must_ have a `adabuild.config.json` file in the project root. This file needs to follow the `IBuildConfig` interface as a schema. Make sure to provide a glob to your projects directory (or whatever it's called) and List your `projectDefinitions` _in order_ of dependency.

Each `projectDefinition` has an optional `buildCommand` value for which you can supply a custom command line string to execute your build process. If none provided, `adabuild` assumes an `npm` script entry for `npm run build:{project-name}`.
