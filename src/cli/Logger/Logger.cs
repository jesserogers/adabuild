using System;

namespace adabuild
{
	public static class Logger
	{

		public static void Info(string message)
		{
			Console.WriteLine($"[adabuild]: {message}");
		}

		public static void Error(string message)
		{
			Console.Error.WriteLine($"[adabuild] ERROR: {message}");
		}

	}
}