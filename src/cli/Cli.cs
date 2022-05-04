using System;
using System.Collections.Generic;

namespace adabuild
{

	public class Cli
	{

		private static readonly string VERSION = "0.0.6";

		private Config.Service configService;

		private Build.Service buildService;

		private Monitor.Service monitorService;

		private CommandLine.Service commandLineService;

		public Cli(
			Config.Service _configService,
			Build.Service _buildService,
			Monitor.Service _monitorService,
			CommandLine.Service _commandLineService
		)
		{
			configService = _configService;
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
			int _exitCode = 0;

			if (_args.Length == 0)
			{
				Console.Error.WriteLine("Invalid argument list");
				_exitCode = 1;
			}
			else
				_exitCode = Command(_args);

			if (monitorService.isRunning)
				Run();
			else
				Environment.Exit(_exitCode);
		}

		/** Returns true if CLI should prompt read line again after execution */
		public int Command(string[] _args)
		{
			Dictionary<string, string> _arguments = ArgumentParser.Parse(_args);
			int _exitCode = 0;

			switch (_args[0].ToLower())
			{
				case "start":
				case "watch":
					Start();
					break;

				case "build":
					if (_args.Length < 2 || String.IsNullOrEmpty(_args[1]))
					{
						Logger.Error("Please provide a valid project name");
						_exitCode = 1;
						break;
					}

					bool _incremental = !_arguments.ContainsKey("--incremental") ||
						_arguments["--incremental"] != "false";
					bool _output = _arguments.ContainsKey("--output") &&
						_arguments["--output"] != "false";
					int _delay = Build.Service.DEFAULT_PARALLEL_DELAY;
					int _concurrency = Injector.ConfigService.GetConcurrencyLimit();

					if (_arguments.ContainsKey("--delay"))
						_delay = Int32.Parse(_arguments["--delay"]);

					if (_arguments.ContainsKey("--concurrency"))
						configService.SetConcurrencyLimit(Int32.Parse(_arguments["--concurrency"]));

					if (_args[1] == "all")
						_exitCode = buildService.BuildAll(_incremental, _output, _delay).GetAwaiter().GetResult();
					else
						_exitCode = buildService.Build(_args[1], _incremental, _output, _delay).GetAwaiter().GetResult();

					// set concurrency limit back to saved value
					configService.SetConcurrencyLimit(_concurrency);

					break;

				case "reset":
				case "clear":
					if (_args.Length > 1 && !String.IsNullOrEmpty(_args[1]))
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
					break;

				case "version":
					Logger.Info(VERSION);
					break;

				case "config":
				{
					if (_arguments.ContainsKey("--terminal"))
						configService.SetTerminal(_arguments["--terminal"]).GetAwaiter().GetResult();
					
					if (_arguments.ContainsKey("--concurrency"))
					{
						int _newLimit = Int32.Parse(_arguments["--concurrency"]);
						configService.SaveConcurrencyLimit(_newLimit).GetAwaiter().GetResult();
					}
					
					break;
				}

				default:
					Logger.Error($"Unknown command \"{_args[0]}\"");
					break;
			}

			return _exitCode;

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