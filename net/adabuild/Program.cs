using System;

namespace adabuild
{
	class Program
	{

		private static FileSystem.Service FileSystemService;

		private static Config.Service ConfigService;

		private static Monitor.State MonitorState;

		private static Monitor.Service MonitorService;

		private static CommandLine.Service CommandLineService;

		private static Build.Service BuildService;

		static void Main(string[] args)
		{
			// construct instances
			FileSystemService = new FileSystem.Service();
			ConfigService = new Config.Service(ref FileSystemService);
			MonitorState = new Monitor.State(ref FileSystemService);
			MonitorService = new Monitor.Service(ref FileSystemService, ref ConfigService, ref MonitorState);
			CommandLineService = new CommandLine.Service(ref FileSystemService);
			BuildService = new Build.Service(ref MonitorService, ref ConfigService, ref CommandLineService);
			
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
						int _exit = BuildService.Build(_project).GetAwaiter().GetResult();
						Console.WriteLine($"Completed build for {_project} with code: {_exit}");
					}
					else
					{
						Console.Error.WriteLine("No project name supplied to build command.");
					}
					break;
				}

				case "watch":
				{
					MonitorService.Start();
					string _userInput = Console.ReadLine();
					Console.WriteLine($"omg user said {_userInput}");
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
