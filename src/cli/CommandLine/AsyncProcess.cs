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
			String _terminal,
			String _command,
			String _directory,
			Action<AsyncProcess> _onStart,
			Func<int, EventHandler> _onExitFactory,
			bool _showOutput = false
		)
		{
			if (!Terminals.IsValid(_terminal))
				throw new Exception($"Invalid terminal type: {_terminal}");

			childProcess = new Process
			{
				EnableRaisingEvents = true,
				StartInfo =
				{
					FileName = _terminal,
					Arguments = _terminal == Terminals.BASH ? $"-c \"{_command}\"" : $"/C {_command}",
					WorkingDirectory = _directory,
					WindowStyle = ProcessWindowStyle.Hidden,
					CreateNoWindow = true,
					UseShellExecute = false,
					RedirectStandardOutput = true
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
			childProcess.BeginOutputReadLine();

			await asyncTask.GetTask();
			return childProcess.ExitCode;
		}

	}

}