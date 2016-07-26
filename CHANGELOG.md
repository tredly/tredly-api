# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [1.0.3] - 2016-07-26
#### Changed
- Fix for NodeJS v4's process spawn

## [1.0.2] - 2016-07-15
#### Changed
- Switch to NodeJS v4

## [1.0.1] - 2016-07-07
#### Changed
- Fixed compatibility issues
- Fixed access issue

## [1.0.0] - 2016-06-23
#### Changed
- Change rc.d script location from /etc/rc.d to /usr/local/etc/rc.d
- Change path to node

#### Added
- Add full paths to installer
- Accept password from input stream in "install.sh (Closes tredly/tredly-api#46)

## [0.5.0] - 2016-06-09
#### Added
- Implemented `service tredlyapi status` command which tell us if API is running and what port its using.
- Implemented `service tredlyapi credentials` command which allow us to change API user credentials

## [0.4.0] - 2016-05-26
#### Added
- Implemented interactive API ("/console" endpoint)

#### Changed
- Fixed: "list"-endpoints return error if the list is empty (JSON mode only)

## [0.3.0] - 2016-05-19
#### Added
- Implemented partition-based security
- Implemented JSON output option for "list"-endpoints
- New "/view/info" endpoint
- Permanent JWT token

#### Changed
- Installation scripts have been simplified
- Better customization of "push" API

## [0.2.0] - 2016-05-04
#### Added
- Integration with Tredly Host installation scripts
- New "/push/files" endpoint
- Non-admin users can update their own details (/edit/user endpoint)

#### Changed
- Using MIT license instead of GPLv3

## v0.1.0 - 2016-04-29
#### Added
- Initial release of Tredly API

[1.0.2]: https://github.com/tredly/tredly-api/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/tredly/tredly-api/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/tredly/tredly-api/compare/v0.5.0...v1.0.0
[0.5.0]: https://github.com/tredly/tredly-api/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/tredly/tredly-api/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/tredly/tredly-api/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/tredly/tredly-api/compare/v0.1.0...v0.2.0
