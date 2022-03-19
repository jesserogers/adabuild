using System;
using System.Diagnostics;
using System.Threading.Tasks;

namespace adabuild.CommandLine
{

	public class AsyncProcess
	{

		public Process childProcess;

		public AsyncProcessTask asyncTask;

		public bool showOutput;

		public int id
		{
			get { return childProcess.Id; }
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
			childProcess = new Process
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
			showOutput = _showOutput;
		}

		public async Task<int> Run(int _delay = 250)
		{
			if (_delay > 0)
				await Task.Delay(_delay);

			childProcess.Start();

			if (OnStart != null)
				OnStart(this);

			asyncTask = new AsyncProcessTask(childProcess, OnExitFactory);

			childProcess.Exited += asyncTask.OnExit;

			if (showOutput)
			{
				childProcess.BeginErrorReadLine();
				childProcess.BeginOutputReadLine();
			}

			await asyncTask.GetTask();
			return childProcess.ExitCode;
		}

	}

}