using System;
using System.Diagnostics;
using System.Threading.Tasks;

namespace adaptiva.adabuild.CommandLine
{

	public class AsyncProcessTask
	{

		private TaskCompletionSource<int> taskCompletionSource = new TaskCompletionSource<int>();

		private Process runningProcess;

		private EventHandler exitHandler;

		private bool showOutput;

		public bool IsCompleted { get; private set; }

		public Task GetTask()
		{
			return taskCompletionSource.Task;
		}

		public void OnExit(object _sender, EventArgs _event)
		{
			if (IsCompleted)
				return;
			
			IsCompleted = true;

			if (exitHandler != null)
				exitHandler(runningProcess, _event);

			taskCompletionSource.TrySetResult(runningProcess.ExitCode);
		}

		public AsyncProcessTask(
			Process _process,
			Func<int, EventHandler> _exitHandlerFactory,
			bool _showOutput = false
		) {
			runningProcess = _process;
			exitHandler = _exitHandlerFactory(_process.Id);
			showOutput = _showOutput;
		}

	}

}