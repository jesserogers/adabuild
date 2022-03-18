using System;

namespace adabuild
{
	class Program
	{

		static FileSystem.Service FileSystemService;

		static Config.Service ConfigService;

		static Monitor.State MonitorState;

		static Monitor.Service MonitorService;

		static CommandLine.Service CommandLineService;

		static Build.Service BuildService;

		static void Main(string[] args)
		{
			// construct instances
			FileSystemService = new FileSystem.Service();
			ConfigService = new Config.Service(ref FileSystemService);
			MonitorState = new Monitor.State(ref FileSystemService);
			MonitorService = new Monitor.Service(ref MonitorState);
			CommandLineService = new CommandLine.Service(ref FileSystemService);
			BuildService = new Build.Service(ref MonitorService, ref ConfigService, ref CommandLineService);
			
			if (args.Length > 0)
				Run(args);
			else
				RunTest();
		}

		static void RunTest()
		{
			int _exit = CommandLineService.Exec(new string[]
			{
				@"/C echo Hello!",
				@"/C npm --version",
				@"/C ng --version",
				@"/C echo Goodbye!"
			}).GetAwaiter().GetResult();

			Console.WriteLine($"Test commands exited with code: {_exit}");
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
					break;

				case "help":
					break;

				case "reset":
				case "clear":
					break;
					
				default:
				{
					RunTest();
					break;
				}
			}
		}
	}
}
