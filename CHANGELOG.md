# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

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

[0.4.0]: https://github.com/tredly/tredly-api/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/tredly/tredly-api/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/tredly/tredly-api/compare/v0.1.0...v0.2.0
