using System.Collections.Generic;

namespace adabuild
{
	public static class ArgumentParser
	{
		public static Dictionary<string, string> Parse(string[] _args)
		{
			Dictionary<string, string> _argumentMap = new Dictionary<string, string>();
		
			if (_args.Length <= 1)
				return _argumentMap;

			for (int i = 1; i < _args.Length; i++)
			{
				if (_args[i].StartsWith("--"))
				{
					if (_args[i].Contains("="))
					{
						string[] _split = _args[i].Split("=");
						string _key = _split[0].Trim();
						string _value = _split[1].Trim();
						_argumentMap.Add(_key, _value);
						continue;
					}

					if (i == _args.Length - 1)
						_argumentMap.Add(_args[i], null);
					else
					{
						if (_args[i + 1].StartsWith("--"))
							_argumentMap.Add(_args[i], null);
						else
						{
							_argumentMap.Add(_args[i], _args[i + 1]);
							i++;
						}
					}
				}
			}

			return _argumentMap;
		}
	}
}