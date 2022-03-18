using System;
using System.Diagnostics;
using System.Threading.Tasks;

namespace adabuild.CommandLine
{

	public class AsyncProcessTask
	{

		private TaskCompletionSource<int> Tcs = new TaskCompletionSource<int>();

		private Process RunningProcess;

		private EventHandler ExitHandler;
		
		private bool isCompleted;

		public bool IsCompleted{
			get { return isCompleted; }
		}

		public Task GetTask()
		{
			return Tcs.Task;
		}

		public void OnExit(object _sender, EventArgs _event)
		{
			if (isCompleted)
				return;

			isCompleted = true;

			if (!RunningProcess.HasExited)
				RunningProcess.WaitForExit();

			Tcs.SetResult(RunningProcess.ExitCode);

			if (ExitHandler != null)
				ExitHandler(RunningProcess, _event);
		}

		public AsyncProcessTask(
			Process _process,
			Func<int, EventHandler> _exitHandlerFactory
		) {
			RunningProcess = _process;
			ExitHandler = _exitHandlerFactory(_process.Id);
		}

	}

}