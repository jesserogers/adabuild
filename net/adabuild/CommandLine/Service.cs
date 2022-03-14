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

		private FileSystem.Service FileSystemService;

		private ConcurrentDictionary<int, AsyncProcess> Processes;

		private ConcurrentDictionary<int, EventHandler> ProcessExitHandlers;

		private ConcurrentDictionary<int, DataReceivedEventHandler> StandardOutHandlers;

		public Service(ref FileSystem.Service _fileSystemService)
		{
			FileSystemService = _fileSystemService;
			Processes = new ConcurrentDictionary<int, AsyncProcess>();
			ProcessExitHandlers = new ConcurrentDictionary<int, EventHandler>();
			StandardOutHandlers = new ConcurrentDictionary<int, DataReceivedEventHandler>();
		}

		public async Task<int> Exec(string _command)
		{
			AsyncProcess _process = SpawnProcess(_command);
			int _exitCode = await _process.Run();
			return _exitCode;
		}

		public async Task<int> Exec(string[] _commands)
		{
			List<Task<int>> _taskList = _commands.Select(_command => Exec(_command)).ToList();

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
			_process.ChildProcess.OutputDataReceived += StandardOutCallbackFactory(_process.Id);
			Processes.TryAdd(_process.Id, _process);
		}

		private DataReceivedEventHandler StandardOutCallbackFactory(int _processId)
		{
			DataReceivedEventHandler _handler = new DataReceivedEventHandler(
				(object sender, DataReceivedEventArgs e) =>
				{
					if (e.Data != null && ((string)e.Data).Length > 0)
						Console.WriteLine($"Process [{_processId}]: {e.Data}");
					
					AsyncProcess _process = Processes[_processId];

					if (_process == null)
					{
						Console.Error.WriteLine($"Process [{_processId}] removed before cleanup!");
						return;
					}
					// check if process has already exited
					if (_process.ChildProcess.HasExited && ProcessExitHandlers.ContainsKey(_process.Id))
						_process.AsyncTask.EventHandler(_process.ChildProcess, null);
				}
			);
			StandardOutHandlers.TryAdd(_processId, _handler);
			return _handler;
		}

		private EventHandler OnProcessExitFactory(int _processId)
		{
			EventHandler _handler = new EventHandler((object sender, EventArgs e) =>
			{
				if (!Processes.ContainsKey(_processId))
				{
					Console.Error.WriteLine($"Cannot find process [{_processId}]");
					return;
				}

				AsyncProcess _process = Processes[_processId];
				Console.WriteLine($"Process [{_processId}] exited with code: {_process.ChildProcess.ExitCode}");

				if (_process.ChildProcess.ExitCode > 0)
				{

					if (_process.ChildProcess.StandardError != null)
					{
						string _error = _process.ChildProcess.StandardError.ReadToEnd();
						if (_error.Length > 0)
							Console.Error.WriteLine(_error);
					}

					DestroyAllProcesses();
					return;
				}

				DestroyProcess(_process);

			});

			ProcessExitHandlers.TryAdd(_processId, _handler);
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

			try
			{
				Console.WriteLine($"Destroying process [{_process.Id}]...");
				_process.ChildProcess.Exited -= ProcessExitHandlers[_process.Id];
				_process.ChildProcess.OutputDataReceived -= StandardOutHandlers[_process.Id];
				
				ProcessExitHandlers.TryRemove(_process.Id, out _processExitHandler);
				StandardOutHandlers.TryRemove(_process.Id, out _stdOutHandler);
				Processes.TryRemove(_process.Id, out _process);

				_process.ChildProcess.Kill();
			}
			catch (Exception e)
			{
				Console.Error.WriteLine($"Failed to destroy process [{_process.Id}]: {e.Message}");
				ProcessExitHandlers.TryRemove(_process.Id, out _processExitHandler);
				StandardOutHandlers.TryRemove(_process.Id, out _stdOutHandler);
				Processes.TryRemove(_process.Id, out _process);
			}
		}

		private void DestroyAllProcesses()
		{
			Console.WriteLine("Destroying all processes...");
			foreach (KeyValuePair<int, AsyncProcess> _process in Processes)
				DestroyProcess(_process.Value);
		}

	}
}
