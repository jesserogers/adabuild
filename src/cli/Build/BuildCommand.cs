using System;
using adaptiva.adabuild.Config;

namespace adaptiva.adabuild.Build
{

	public struct BuildCommand
	{
		private ProjectDefinition project;
		
		private BuildRequest request;

		public BuildCommand(ProjectDefinition project, BuildRequest buildRequest)
		{
			this.project = project;
			this.request = buildRequest;
		}

		public override string ToString()
		{
			string _buildCommand;
			
			if (String.IsNullOrEmpty(project.buildCommand))
				_buildCommand = $"ng build {project.name}";
			else
				_buildCommand = project.buildCommand;

			if (_buildCommand.StartsWith("npm run"))
				_buildCommand += " --";
						
			return (request.projects.Contains(project.name)) ?
				_buildCommand + " " + request.arguments :
				_buildCommand;
		}

	}
	
}