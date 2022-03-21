namespace adabuild.Config
{
	public class BuildConfiguration
	{

		public string projectsFolder { get; set; }

		public ProjectDefinition[] projectDefinitions { get; set; }

		public byte maxConcurrentBuilds { get; set; }

		public string preBuild { get; set; }

		public string postBuild { get; set; }

		public BuildConfiguration()
		{

		}

	}
}
