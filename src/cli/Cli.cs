using System;

namespace adabuild
{

	public class Cli
	{

		private Build.Service buildService;

		private Monitor.Service monitorService;

		public Cli(ref Build.Service _buildService, ref Monitor.Service _monitorService)
		{
			buildService = _buildService;
			monitorService = _monitorService;
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
			}
			string _command = _args[0].Trim();
			
			switch (_args[0])
			{
				case "build":
				{
					string _project = _args[1];
					if (_project == null || _project.Length < 1)
					{
						Console.Error.WriteLine("Please provide a valid project name");
						break;
					}
					buildService.Build(_project).GetAwaiter().GetResult();
					// @todo: handle --incremental flag
					break;
				}

				case "reset":
				{
					monitorService.state.Clear();
					monitorService.state.Save().GetAwaiter().GetResult();
					break;
				}

				case "cls":
				{
					Console.Clear();
					break;
				}
			}

			Run();
		}

		private string Prompt()
		{
			Console.Write("adabuild > ");
			return Console.ReadLine();
		}

	}

}