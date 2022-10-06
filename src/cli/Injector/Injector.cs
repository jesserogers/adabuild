using adaptiva.adabuild.Build;
using adaptiva.adabuild.CommandLine;
using adaptiva.adabuild.Config;
using adaptiva.adabuild.FileSystem;
using adaptiva.adabuild.Monitor;

namespace adaptiva.adabuild
{

	public static class Injector
	{

		private static FileSystemService _fileSystemService;

		private static ConfigService _configService;

		private static MonitorState _monitorState;

		private static MonitorService _monitorService;

		private static CommandLineService _commandLineService;

		private static BuildService _buildService;

		private static Cli _cli;

		public static FileSystemService fileSystemService
		{
			get
			{
				if (_fileSystemService == null)
					_fileSystemService = new FileSystemService();
				return _fileSystemService;
			}
		}

		public static ConfigService configService
		{
			get
			{
				if (_configService == null)
					_configService = new ConfigService(fileSystemService);
				return _configService;
			}
		}

		public static MonitorState monitorState
		{
			get
			{
				if (_monitorState == null)
					_monitorState = new MonitorState(fileSystemService);
				return _monitorState;
			}
		}

		public static MonitorService monitorService
		{
			get
			{
				if (_monitorService == null)
					_monitorService = new MonitorService(fileSystemService, configService, monitorState);
				return _monitorService;
			}
		}

		public static CommandLineService commandLineService
		{
			get
			{
				if (_commandLineService == null)
					_commandLineService = new CommandLineService(fileSystemService, configService);
				return _commandLineService;
			}
		}

		public static BuildService buildService
		{
			get
			{
				if (_buildService == null)
					_buildService = new BuildService(monitorService, configService, commandLineService);
				return _buildService;
			}
		}

		public static Cli CLI
		{
			get
			{
				if (_cli == null)
					_cli = new Cli();
				return _cli;
			}
		}

	}

}