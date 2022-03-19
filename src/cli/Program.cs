﻿using System;

namespace adabuild
{
	class Program
	{

		private static FileSystem.Service fileSystemService;

		private static Config.Service configService;

		private static Monitor.State monitorState;

		private static Monitor.Service monitorService;

		private static CommandLine.Service commandLineService;

		private static Build.Service buildService;

		private static Cli cli;

		static void Main(string[] args)
		{
			// construct instances
			fileSystemService = new FileSystem.Service();
			configService = new Config.Service(ref fileSystemService);
			monitorState = new Monitor.State(ref fileSystemService);
			monitorService = new Monitor.Service(ref fileSystemService, ref configService, ref monitorState);
			commandLineService = new CommandLine.Service(ref fileSystemService);
			buildService = new Build.Service(ref monitorService, ref configService, ref commandLineService);
			cli = new Cli(ref buildService, ref monitorService, ref commandLineService);
			
			if (args.Length > 0)
				Run(args);
		}

		static void Run(string[] _args)
		{
			switch (_args[0])
			{
				case "build":
				{
					if (_args.Length > 1)
					{
						string _project = _args[1];
						int _exit = buildService.Build(_project).GetAwaiter().GetResult();
						Console.WriteLine($"Completed build for {_project} with code: {_exit}");
					}
					else
					{
						Console.Error.WriteLine("No project name supplied to build command.");
					}
					break;
				}

				case "run":
				{
					cli.Start();
					break;
				}

				case "help":
					break;

				case "reset":
				case "clear":
					break;
					
				default:
				{
					throw new Exception($"Invalid arguments provided: {_args[0]}");
				}
			}
		}
	}
}
