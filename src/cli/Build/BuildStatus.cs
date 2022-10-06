using System;

namespace adaptiva.adabuild.Build
{

	public struct BuildStatus
	{

		public string message;

		public Benchmark benchmark;

		public BuildStatus(string message)
		{
			this.message = message;
			this.benchmark = default;
			Report();
		}

		public BuildStatus(string message, Benchmark timer)
		{
			this.message = message;
			this.benchmark = timer;
			Report();
		}

		public void Report()
		{
			Report(message);
		}

		public void Report(string _message)
		{
			string _time = $"{DateTime.Now.ToShortDateString()} {DateTime.Now.ToShortTimeString()}";
			string _status = $"{_time} - {_message}";
			if (benchmark != default(Benchmark))
			{
				_status += $" in {benchmark.Elapsed()}";
			}
			Logger.Info(_status);
		}
		
	}
	
}