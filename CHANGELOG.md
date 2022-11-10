# mklic v2.0.0

## New Features 🎉
- More licenses!  
  *mklic* now uses the *SPDX* license API to get up-to-date licenses!
    - NOTE: The first time you use v2.0.0, you will need an internet connection to fetch all the licenses, afterwards it will be cached for the later use.
- BREAKING CHANGE: Previously, all the licenses were built in, now they are fetched from a third-party API.
- BREAKING CHANGE: Previously, licenses were in YAML format, now they are stored in JSON.
- Added a loading spinner.
- Added a new flag: `-d, --deprecated` for showing deprecated licenses.
- Added a new flag: `-o, --non-osi` for showing non-osi-approved licenses.
- Added a new flag: `-r, --remove-cache` for deleting the cached licenses. (You shouldn't need.)

## Tweaks 🔧
- Renamed the `-n, --name` flag to `-q, --query`.
- Renamed the `-o, --output` flag to `-p, --paths`.
- Repalced yargs with commander.js.
- Replaced prompts with inquirer.js.

## Bug Fixes 🐜
- Fixed a crash when selecting a license that required no inputs.
