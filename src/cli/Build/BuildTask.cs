namespace adabuild.Build
{

	public struct BuildRequest
	{
		public string project;
		
		public bool incremental;
		
		public bool output;
		
		public string arguments;

		public bool prebuild;

		public bool postbuild;
		
		public int delay;
	}

}