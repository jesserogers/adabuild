﻿namespace adabuild
{
	class Program
	{

		static void Main(string[] args)
		{
			if (args.Length > 0)
				Injector.CLI.Command(args);
		}

	}
}
