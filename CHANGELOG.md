# Change Log

All notable changes to the "adabuild" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

 - CLI
 - Parallel builds

### v0.0.1

 - VS Code Extension with intelligent command chaining to provide a simple incremental building experience

### v0.0.2

## Changed
 - Abstracted the VS Code Extension into an application capable of running builds in parallel
 - Listen to result of each build instead of chaining one giant command
 - Use Chokidar for file watching

## Added
 - CLI application
 - Documentation
 
## Removed
 - VS Code Extension output.
   - The VS Code Extension .VSIX file output doesn't correctly bundle its dependencies, and the only fix I know of right now is to manually install them. And that's not an option in the developer VMs. Please use the CLI until the extension is functioning again.