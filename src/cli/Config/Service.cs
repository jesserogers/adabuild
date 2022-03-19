﻿using System.Threading.Tasks;
using System.Collections.Generic;

namespace adabuild.Config
{
	public class Service
	{

		public BuildConfiguration Configuration;

		private FileSystem.Service FileSystemService;

		private Dictionary<string, ProjectDefinition> ProjectMap;

		public Service(ref FileSystem.Service _fileSystem)
		{
			FileSystemService = _fileSystem;
			ProjectMap = new Dictionary<string, ProjectDefinition>();
			LoadConfiguration();
		}

		public void LoadConfiguration()
		{
			Configuration = FileSystemService.ReadFile<BuildConfiguration>(FileSystemService.Root + @"\adabuild.config.json");

			foreach (ProjectDefinition _project in Configuration.projectDefinitions)
				ProjectMap[_project.name] = _project;
		}

		public ProjectDefinition GetProject(string _name)
		{
			if (ProjectMap.ContainsKey(_name))
				return ProjectMap[_name];

			return null;
		}

		public byte GetConcurrencyLimit()
		{
			return Configuration.maxConcurrentBuilds;
		}

		public async Task CopyTsConfigProd()
		{
			string _from = FileSystemService.Root + "\\tsconfig.prod.json";
			string _to = FileSystemService.Root + "\\tsconfig.json";
			await FileSystemService.CopyFile(_from, _to);
		}

		public async Task CopyTsConfigDev()
		{
			string _from = FileSystemService.Root + "\\tsconfig.dev.json";
			string _to = FileSystemService.Root + "\\tsconfig.json";
			await FileSystemService.CopyFile(_from, _to);
		}

	}
}
