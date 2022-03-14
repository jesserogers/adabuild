using System;
using System.Threading.Tasks;

namespace adabuild.Monitor
{

	public class Service
	{

		public State State;

		public Service(ref State _state)
		{
			State = _state;
		}

		public void Start()
		{
			Console.WriteLine("Starting Monitor Service...");
			Watch();
		}

		public async Task Reset()
		{
			State.Clear();
			await State.Save();
		}

		public async Task Reset(string _project)
		{
			State.Clear(_project);
			await State.Save();
		}

		public async Task Reset(string[] _projects)
		{
			foreach (string _project in _projects)
				State.Clear(_project);

			await State.Save();
		}

		private void Watch()
		{
			// @todo: all of it!
		}

	}

}