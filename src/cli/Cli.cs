using System;
using System.Collections.Generic;

namespace adabuild
{

	public class Cli
	{

		private Build.Service buildService;

		private Monitor.Service monitorService;

		private CommandLine.Service commandLineService;

		public Cli(
			Build.Service _buildService,
			Monitor.Service _monitorService,
			CommandLine.Service _commandLineService
		)
		{
			buildService = _buildService;
			monitorService = _monitorService;
			commandLineService = _commandLineService;
		}

		public void Start()
		{
			monitorService.Start();
			Run();
		}

		private void Run()
		{
			string _input = Prompt();
			string[] _args = _input.Split(" ");
			
			if (_args.Length == 0)
			{
				Console.Error.WriteLine("Invalid argument list");
				return;
			}

			string _command = _args[0].Trim();
			Dictionary<string, string> _arguments = ArgumentParser.Parse(_args);
			
			switch (_command)
			{
				case "build":
					if (_args[1] == null || _args[1].Length < 1)
					{
						Console.Error.WriteLine("Please provide a valid project name");
						break;
					}

					bool _incremental = !_arguments.ContainsKey("--incremental") ||
						_arguments["--incremental"] != "false";
					bool _output = _arguments.ContainsKey("--output") &&
						_arguments["--output"] != "false";

					if (_args[1] == "all")
						buildService.BuildAll(_incremental).GetAwaiter().GetResult();
					else
						buildService.Build(_args[1], _incremental, _output).GetAwaiter().GetResult();
					break;

				case "reset":
				case "clear":
					if (_args.Length > 1 && _args[1] != null && _args[1].Length > 0)
						monitorService.state.Clear(_args[1]);
					else
						monitorService.state.Clear();
					monitorService.state.Save().GetAwaiter().GetResult();
					break;

				case "cls":
					Console.Clear();
					break;

				case "stop":
				case "kill":
					Stop();
					return;

				default:
					Logger.Error($"Unknown command \"{_args[0]}\"");
					break;
			}

			Run();
		}

		private void Stop()
		{
			commandLineService.DestroyAllProcesses();
			monitorService.Stop();
		}

		private string Prompt()
		{
			Console.Write("adabuild > ");
			return Console.ReadLine();
		}

	}

}