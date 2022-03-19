using System;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Collections.Concurrent;

namespace adabuild.CommandLine
{
	public class Service
	{

		private FileSystem.Service FileSystemService;

		private ConcurrentDictionary<int, AsyncProcess> Processes;

		private ConcurrentDictionary<int, EventHandler> processExitHandlers;

		private ConcurrentDictionary<int, DataReceivedEventHandler> standardOutHandlers;

		private ConcurrentDictionary<int, DataReceivedEventHandler> standardErrorHandlers;

		public Service(ref FileSystem.Service _fileSystemService)
		{
			FileSystemService = _fileSystemService;
			Processes = new ConcurrentDictionary<int, AsyncProcess>();
			processExitHandlers = new ConcurrentDictionary<int, EventHandler>();
			standardOutHandlers = new ConcurrentDictionary<int, DataReceivedEventHandler>();
			standardErrorHandlers = new ConcurrentDictionary<int, DataReceivedEventHandler>();
		}

		public async Task<int> Exec(string _command, int _delay = 0)
		{
			AsyncProcess _process = SpawnProcess(_command);

			if (_delay > 0)
				await Task.Delay(_delay);
			
			int _exitCode = await _process.Run();
			return _exitCode;
		}

		public async Task<int> Exec(string[] _commands, int _delay = 0)
		{
			int _wait = 0;
			List<Task<int>> _taskList = _commands.Select(_command => {
				_wait += _delay;
				return Exec(_command, _delay);
			}).ToList();

			while (_taskList.Any())
			{
				Task<int> _completed = await Task.WhenAny(_taskList);
				_taskList.Remove(_completed);
				int _exitCode = await _completed;
				if (_exitCode > 0)
				{
					Console.Error.WriteLine("Encountered error in parallel execution: stopping further processes...");
					return 1;
				}
			}
			return 0;
		}

		private void RegisterProcess(AsyncProcess _process)
		{
			_process.childProcess.OutputDataReceived += StandardOutCallbackFactory(_process.id);
			_process.childProcess.ErrorDataReceived += StandardErrorCallbackFactory(_process.id);
			Processes.TryAdd(_process.id, _process);
		}

		private DataReceivedEventHandler StandardOutCallbackFactory(int _processId)
		{
			DataReceivedEventHandler _handler = new DataReceivedEventHandler(
				(object sender, DataReceivedEventArgs e) =>
				{
					AsyncProcess _process = Processes[_processId];

					if (_process == null)
						return;

					else
					{

						if (_process.showOutput && e.Data != null && ((string)e.Data).Length > 0)
							Console.WriteLine($"Process [{_processId}]: {e.Data}");

						if (
							_process.childProcess.HasExited &&
							processExitHandlers.ContainsKey(_process.id) &&
							!_process.asyncTask.IsCompleted
						)
						{
							_process.asyncTask.OnExit(_process.childProcess, null);
						}
					}
				}
			);
			standardOutHandlers.TryAdd(_processId, _handler);
			return _handler;
		}

		private DataReceivedEventHandler StandardErrorCallbackFactory(int _processId)
		{
			DataReceivedEventHandler _handler = new DataReceivedEventHandler((object s, DataReceivedEventArgs e) =>
			{
				AsyncProcess _process = Processes[_processId];

				if (_process == null)
					return;

				else
				{
					if (_process.showOutput && e.Data != null && ((string)e.Data).Length > 0)
						Console.Error.WriteLine($"Process [{_processId}]: {e.Data}");

					if (
						_process.childProcess.HasExited &&
						processExitHandlers.ContainsKey(_process.id) &&
						!_process.asyncTask.IsCompleted
					)
					{
						_process.asyncTask.OnExit(_process.childProcess, null);
					}
				}
			});
			standardErrorHandlers.TryAdd(_processId, _handler);
			return _handler;
		}

		private EventHandler OnProcessExitFactory(int _processId)
		{
			EventHandler _handler = new EventHandler((object sender, EventArgs e) =>
			{
				if (!Processes.ContainsKey(_processId))
					return;

				AsyncProcess _process = Processes[_processId];

				if (_process.childProcess.ExitCode > 0)
					DestroyAllProcesses();
				else
					DestroyProcess(_process);

			});

			processExitHandlers.TryAdd(_processId, _handler);
			return _handler;
		}

		private AsyncProcess SpawnProcess(string _command)
		{
			return new AsyncProcess(_command, FileSystemService.Root,
				RegisterProcess, OnProcessExitFactory);
		}

		private void DestroyProcess(AsyncProcess _process)
		{
			EventHandler _processExitHandler;
			DataReceivedEventHandler _stdOutHandler;
			DataReceivedEventHandler _stdErrHandler;

			try
			{
				_process.childProcess.Exited -= processExitHandlers[_process.id];
				_process.childProcess.OutputDataReceived -= standardOutHandlers[_process.id];
				_process.childProcess.ErrorDataReceived -= standardErrorHandlers[_process.id];

				processExitHandlers.TryRemove(_process.id, out _processExitHandler);
				standardOutHandlers.TryRemove(_process.id, out _stdOutHandler);
				standardErrorHandlers.TryRemove(_process.id, out _stdErrHandler);
				Processes.TryRemove(_process.id, out _process);

				_process.childProcess.Kill();
			}
			catch (Exception e)
			{
				Console.Error.WriteLine($"Failed to destroy process [{_process.id}]: {e.Message}");
				processExitHandlers.TryRemove(_process.id, out _processExitHandler);
				standardOutHandlers.TryRemove(_process.id, out _stdOutHandler);
				Processes.TryRemove(_process.id, out _process);
			}
		}

		private void DestroyAllProcesses()
		{
			foreach (KeyValuePair<int, AsyncProcess> _process in Processes)
				DestroyProcess(_process.Value);
		}

	}
}
