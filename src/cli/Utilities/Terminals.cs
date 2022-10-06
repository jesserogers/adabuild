using System.Collections.Generic;

namespace adaptiva.adabuild
{
	public static class Terminals
	{

		public static readonly string CMD = "cmd.exe";

		public static readonly string BASH = "bash";

		private static HashSet<string> VALID_TERMINALS = new HashSet<string> { CMD, BASH };

		public static bool IsValid(string _terminal)
		{
			return VALID_TERMINALS.Contains(_terminal);
		}

		public static string GetTerminalCommand(string _terminal, string _command)
		{
			switch (_terminal)
			{
				case "cmd.exe":
				case "cmd":
					return $"/C {_command}";
				case "bash":
					return $"-c \"{_command}\"";
				default:
					throw new System.Exception("Invalid terminal type: " + _terminal);
			}
		}

	}
}