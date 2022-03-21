using System;
using System.Collections.Generic;

namespace adabuild
{
	class Program
	{

		static void Main(string[] args)
		{
			
			if (args.Length > 0)
				Run(args);
		}

		static void Run(string[] _args)
		{
			switch (_args[0])
			{
				case "build":
					if (_args.Length > 1)
					{
						Dictionary<string, string> _arguments = ArgumentParser.Parse(_args);
						string _project = _args[1];
						bool _incremental = !_arguments.ContainsKey("--incremental") ||
							_arguments["--incremental"] != "false";
						bool _output = _arguments.ContainsKey("--output") &&
							_arguments["--output"] != "false";
						int _exit;
						
						if (_project == "all")
							_exit = Injector.BuildService.BuildAll(_incremental, _output).GetAwaiter().GetResult();
						else
							_exit = Injector.BuildService.Build(_project, _incremental, _output).GetAwaiter().GetResult();

						Console.WriteLine($"Completed build for {_project} with code: {_exit}");
					}
					else
					{
						Console.Error.WriteLine("No project name supplied to build command.");
					}
					break;

				case "start":
					Injector.CLI.Start();
					break;

				case "reset":
				case "clear":
					if (_args.Length > 1 && _args[1] != null && _args[1].Length > 0)
						Injector.MonitorService.state.Clear(_args[1]);
					else
						Injector.MonitorService.state.Clear();
					Injector.MonitorService.state.Save().GetAwaiter().GetResult();
					break;

				case "terminal":
					if (_args.Length > 1 && !String.IsNullOrEmpty(_args[1]))
						Injector.ConfigService.SetTerminal(_args[1]).GetAwaiter().GetResult();
					else
						Logger.Error("Please supply a terminal type.");
					break;
					
				default:
					throw new Exception($"Invalid arguments provided: {_args[0]}");
			}
		}
	}
}
