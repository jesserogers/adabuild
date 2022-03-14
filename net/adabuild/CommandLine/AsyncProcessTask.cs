using System;
using System.Diagnostics;
using System.Threading.Tasks;

namespace adabuild.CommandLine
{

	public class AsyncProcessTask
	{

		private TaskCompletionSource<int> Tcs = new TaskCompletionSource<int>();

		private Process RunningProcess;

		private EventHandler Handler;

		public Task GetTask()
		{
			return Tcs.Task;
		}

		public void EventHandler(object _sender, EventArgs _event)
		{
			if (!RunningProcess.HasExited)
				RunningProcess.WaitForExit();

			if (Tcs.Task.IsCompleted)
				return;

			Tcs.SetResult(RunningProcess.ExitCode);

			if (Handler != null)
				Handler(RunningProcess, _event);
		}

		public AsyncProcessTask(Process _process, Func<int, EventHandler> _exitFactory)
		{
			RunningProcess = _process;
			Handler = _exitFactory(_process.Id);
		}

	}

}