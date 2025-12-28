# Change Log

All notable changes to the "commit-intent-detector" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.0.1] - 2024-12-XX

### Added
- Initial release of Commit Intent Detector
- Automatic commit intent detection on file save
- Backend API integration for intent analysis
- Git diff extraction and analysis
- Real-time notifications with detected intent
- Status bar indicator for analysis progress
- Configurable API endpoint URL
- Configurable timeout settings
- Enable/disable toggle
- Debounce delay configuration
- Status bar visibility toggle
- Smart file filtering (binary files, ignored directories)
- Comprehensive error handling
- Network error detection and user-friendly messages
- Support for Windows, macOS, and Linux
- Graceful handling of non-git repositories
- Empty diff detection and skipping
- Large diff size limits (5MB max)

### Technical Details
- Uses `node-fetch` v3 for HTTP requests
- Uses `child_process.exec` for git commands
- Pure JavaScript implementation (no TypeScript)
- VS Code configuration API integration
- Debouncing to prevent excessive API calls
- Cross-platform path handling