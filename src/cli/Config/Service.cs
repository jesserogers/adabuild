using System.Threading.Tasks;
using System.Collections.Generic;

namespace adabuild.Config
{
	public class Service
	{

		public BuildConfiguration configuration;

		private FileSystem.Service fileSystemService;

		private Dictionary<string, ProjectDefinition> projectMap;

		public Service(ref FileSystem.Service _fileSystem)
		{
			fileSystemService = _fileSystem;
			projectMap = new Dictionary<string, ProjectDefinition>();
			LoadConfiguration();
		}

		public void LoadConfiguration()
		{
			configuration = fileSystemService.ReadFile<BuildConfiguration>(fileSystemService.Root + @"\adabuild.config.json");

			foreach (ProjectDefinition _project in configuration.projectDefinitions)
				projectMap[_project.name] = _project;
		}

		public ProjectDefinition GetProject(string _name)
		{
			if (projectMap.ContainsKey(_name))
				return projectMap[_name];

			return null;
		}

		public byte GetConcurrencyLimit()
		{
			return configuration.maxConcurrentBuilds;
		}

		public async Task CopyTsConfigProd()
		{
			string _from = fileSystemService.Root + "\\tsconfig.prod.json";
			string _to = fileSystemService.Root + "\\tsconfig.json";
			await fileSystemService.CopyFile(_from, _to);
		}

		public async Task CopyTsConfigDev()
		{
			string _from = fileSystemService.Root + "\\tsconfig.dev.json";
			string _to = fileSystemService.Root + "\\tsconfig.json";
			await fileSystemService.CopyFile(_from, _to);
		}

	}
}
