using System;
using System.Threading.Tasks;

namespace adabuild
{

	public class Cli
	{

		private Build.Service BuildService;

		private Monitor.Service MonitorService;

		public Cli(Build.Service _buildService, Monitor.Service _monitorService)
		{
			BuildService = _buildService;
			MonitorService = _monitorService;
		}

	}

}