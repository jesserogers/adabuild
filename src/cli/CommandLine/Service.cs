﻿using System;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Collections.Concurrent;

namespace adabuild.CommandLine
{
	public class Service
	{

		private FileSystem.Service fileSystemService;

		private Config.Service configService;

		private ConcurrentDictionary<int, AsyncProcess> Processes;

		private ConcurrentDictionary<int, EventHandler> processExitHandlers;

		private ConcurrentDictionary<int, DataReceivedEventHandler> standardOutHandlers;

		public Service(FileSystem.Service _fileSystemService, Config.Service _configService)
		{
			fileSystemService = _fileSystemService;
			configService = _configService;
			Processes = new ConcurrentDictionary<int, AsyncProcess>();
			processExitHandlers = new ConcurrentDictionary<int, EventHandler>();
			standardOutHandlers = new ConcurrentDictionary<int, DataReceivedEventHandler>();
		}

		public async Task<int> Exec(string _command, int _delay = 0, bool _output = false)
		{
			AsyncProcess _process = SpawnProcess(_command, _output);

			if (_delay > 0)
				await Task.Delay(_delay);
			
			return await _process.Run();
		}

		public async Task<int> Exec(string[] _commands, int _delay = 0, bool _output = false)
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
					Logger.Error("Encountered error in parallel execution: stopping further processes...");
					return 1;
				}
			}
			return 0;
		}

		private void RegisterProcess(AsyncProcess _process)
		{
			_process.childProcess.OutputDataReceived += StandardOutCallbackFactory(_process.id);
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

						if (_process.showOutput && !String.IsNullOrEmpty(e.Data))
							Logger.Info($"Process [{_processId}]: {e.Data}");

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

		private AsyncProcess SpawnProcess(string _command, bool _output)
		{
			return new AsyncProcess(configService.configuration.terminal, _command,
				fileSystemService.Root, RegisterProcess, OnProcessExitFactory, _output);
		}

		private void DestroyProcess(AsyncProcess _process)
		{
			EventHandler _processExitHandler;
			DataReceivedEventHandler _stdOutHandler;

			try
			{
				_process.childProcess.Exited -= processExitHandlers[_process.id];
				_process.childProcess.OutputDataReceived -= standardOutHandlers[_process.id];

				processExitHandlers.TryRemove(_process.id, out _processExitHandler);
				standardOutHandlers.TryRemove(_process.id, out _stdOutHandler);
				Processes.TryRemove(_process.id, out _process);

				_process.childProcess.Kill();
			}
			catch (Exception e)
			{
				Logger.Error($"Failed to destroy process [{_process.id}]: {e.Message}");
				processExitHandlers.TryRemove(_process.id, out _processExitHandler);
				standardOutHandlers.TryRemove(_process.id, out _stdOutHandler);
				Processes.TryRemove(_process.id, out _process);
			}
		}

		public void DestroyAllProcesses()
		{
			if (Processes.Count == 0)
				return;

			foreach (KeyValuePair<int, AsyncProcess> _process in Processes)
				DestroyProcess(_process.Value);
		}

	}

}