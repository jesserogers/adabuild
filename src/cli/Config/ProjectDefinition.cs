﻿using System;

namespace adaptiva.adabuild.Config
{
	public class ProjectDefinition
	{

		public string type { get; set; }

		public string name { get; set; }

		public string[] dependencies { get; set; }

		public string buildCommand { get; set; }

		public string debugCommand { get; set; }

		public string redirect { get; set; }

		public ProjectDefinition()
		{

		}

		public string Directory()
		{
			return String.IsNullOrEmpty(redirect) ? name : redirect;
		}

	}
}
