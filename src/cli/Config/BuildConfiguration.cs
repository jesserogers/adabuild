using System.Text.Json;

namespace adaptiva.adabuild.Config
{
	public class BuildConfiguration
	{

		public string projectsFolder { get; set; }

		public ProjectDefinition[] projectDefinitions { get; set; }

		public int maxConcurrentBuilds { get; set; } = 0;

		public string preBuild { get; set; }

		public string postBuild { get; set; }

		public string terminal { get; set; } = "cmd.exe";

		// supports comma separated list
		public string[] fileExtensions { get; set; } = new string[1] { "*" };

		public string onError { get; set; }

		public string version { get; set; }

		public BuildConfiguration()
		{

		}

		public string Export()
		{
			JsonSerializerOptions _options = new JsonSerializerOptions
			{
				WriteIndented = true
			};
			return JsonSerializer.Serialize(this, _options);
		}

	}
}
