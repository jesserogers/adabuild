using System;
using System.Diagnostics;
using System.Threading.Tasks;

namespace adabuild.CommandLine
{

	public class AsyncProcess
	{

		public Process ChildProcess;

		public AsyncProcessTask AsyncTask;

		public bool ShowOutput;

		public int Id
		{
			get { return ChildProcess.Id; }
		}

		private Action<AsyncProcess> OnStart;

		private Func<int, EventHandler> OnExitFactory;

		public AsyncProcess(
			String _command,
			String _directory,
			Action<AsyncProcess> _onStart,
			Func<int, EventHandler> _onExitFactory,
			bool _showOutput = false
		)
		{
			ChildProcess = new Process
			{
				EnableRaisingEvents = true,
				StartInfo =
				{
					FileName = "cmd.exe",
					Arguments = $"/C {_command}",
					WorkingDirectory = _directory,
					WindowStyle = ProcessWindowStyle.Hidden,
					CreateNoWindow = false,
					RedirectStandardOutput = true,
					RedirectStandardError = true
				}
			};
			OnStart = _onStart;
			OnExitFactory = _onExitFactory;
			ShowOutput = _showOutput;
		}

		public async Task<int> Run(int _delay = 250)
		{

			if (_delay > 0)
				await Task.Delay(_delay);

			ChildProcess.Start();

			if (OnStart != null)
				OnStart(this);

			Console.WriteLine($"Started process [{ChildProcess.Id}]");
			AsyncTask = new AsyncProcessTask(ChildProcess, OnExitFactory);

			ChildProcess.Exited += AsyncTask.OnExit;

			ChildProcess.BeginErrorReadLine();
			ChildProcess.BeginOutputReadLine();

			await AsyncTask.GetTask();
			return ChildProcess.ExitCode;
		}

	}

}