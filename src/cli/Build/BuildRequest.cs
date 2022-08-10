using System.Collections.Generic;

namespace adabuild.Build
{

	public struct BuildRequest
	{
		public HashSet<string> projects;
		
		public bool incremental;
		
		public bool output;
		
		public string arguments;

		public bool prebuild;

		public bool postbuild;
		
		public int delay;
	}

}