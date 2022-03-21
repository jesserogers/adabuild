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
			ref Build.Service _buildService,
			ref Monitor.Service _monitorService,
			ref CommandLine.Service _commandLineService
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
			Dictionary<string, string> _arguments = ParseArguments(_args);
			
			switch (_command)
			{
				case "build":
					string _project = _args[1];
					if (_project == null || _project.Length < 1)
					{
						Console.Error.WriteLine("Please provide a valid project name");
						break;
					}

					bool _incremental = true;
					
					if (
						_arguments.ContainsKey("--incremental") &&
						_arguments["--incremental"] == "false"
					)
						_incremental = false;

					if (_project == "all")
						buildService.BuildAll(_incremental).GetAwaiter().GetResult();
					else
						buildService.Build(_project, _incremental).GetAwaiter().GetResult();
					break;

				case "reset":
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

		public Dictionary<string, string> ParseArguments(string[] _args)
		{
			if (_args.Length == 0)
				return null;

			Dictionary<string, string> _argumentMap = new Dictionary<string, string>();

			for (int i = 1; i < _args.Length; i++)
			{
				if (_args[i].StartsWith("--"))
				{
					if (_args[i].Contains("="))
					{
						string[] _split = _args[i].Split("=");
						string _key = _split[0].Trim();
						string _value = _split[1].Trim();
						_argumentMap.Add(_key, _value);
						continue;
					}

					if (i == _args.Length - 1)
						_argumentMap.Add(_args[i], null);
					else
					{
						_argumentMap.Add(_args[i], _args[i + 1]);
						i++;
					}
				}
			}

			return _argumentMap;
		}

	}

}