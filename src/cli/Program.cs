namespace adaptiva.adabuild
{
	class Program
	{

		static int Main(string[] args)
		{
			if (args.Length > 0)
			{
				return Injector.cli.Command(args);
			}
			Logger.Error("Invalid arguments");
			return 1;
		}

	}
}
