# Change Log

All notable changes to the "adabuild" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

### v0.0.10

#### Added
 - Added a `Warn` method to `Logger` static class
 - Added `semver` package
 - Added `version` property to `BuildConfiguration`, plus a check on load to make sure installed version isn't outdated

#### Fixed
 - Fixed various uncaught `KeyNotFoundException` instances
 - Fixed a performance issue where `MonitorService#DetectChanges` waited until after enumerating the directory to check if the project exists in the state map

### v0.0.9

#### Fixed
 - Fixed duplicate log messages around pre-build script execution
 - Added stack traces to `CommandLineService#DestroyProcess` error handlers
 - Fixed `NullReferenceException` in `CommandLineService#DestroyProcess`
 - Fixed an issue where adabuild logged a C# class name instead of an Angular project name

#### Removed
 - Removed `ConfigService#CopyTsConfig` method

### v0.0.8

#### Fixed
 - Fixed error handling in `CommandLineService#DestroyProcess`

#### Added
 - Added timestamps to all build status messages in `BuildService`

### v0.0.7

#### Fixed
 - Fixed potential `NullReferenceException` in `CommandLineService`

#### Added
 - Added new property to `BuildConfiguration`: `onError`, allowing post-failure script execution

#### Changed
 - Renamed/refactored service classes

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

