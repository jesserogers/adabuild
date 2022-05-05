# Change Log

All notable changes to the "adabuild" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

### v0.0.6

#### Fixed
 - Fixed occasional `NullReferenceException` in `DestroyProcess`

#### Added
 - New command: `version`
 - New command: `config`

### v0.0.5

#### Added
 - Optional file extension property on build config to specify what files to watch.

#### Changed
 - Store unix timestamp of last project build time instead of increment.
 - Manually check all files in directory on build service startup to check for unwatched changes.

### v0.0.4

#### Changed
 - Removed logic that started `adabuild` immediately on extension activation. This prevents `adabuild` from starting up any time you open VS Code, even if it's not in a project directory.
 - Made commands and arguments case insensitive

#### Fixed
 - Fixed an uncaught exception around StandardError redirection

### v0.0.3

#### Added
 - New CLI application written on .NET Core 3.1
 - Rewrote VS Code extension to simply invoke the .NET application

#### Removed
 - Node.js based CLI

### v0.0.2

#### Changed
 - Abstracted the VS Code Extension into an application capable of running builds in parallel
 - Listen to result of each build instead of chaining one giant command
 - Use Chokidar for file watching

#### Added
 - CLI application
 - Documentation
 
#### Removed
 - VS Code Extension output.
   - The VS Code Extension .VSIX file output doesn't correctly bundle its dependencies, and the only fix I know of right now is to manually install them. And that's not an option in the developer VMs. Please use the CLI until the extension is functioning again.

### v0.0.1

 - VS Code Extension with intelligent command chaining to provide a simple incremental building experience

