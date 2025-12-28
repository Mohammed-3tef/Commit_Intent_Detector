# Commit Intent Detector

A VS Code extension that automatically detects the commit intent of your code changes when you save files. It uses a backend API to analyze git diffs and predict whether your changes represent a bug fix, new feature, refactor, risky commit, or documentation/test updates.

## Features

- **Automatic Detection**: Automatically analyzes files when you save them
- **Git Diff Analysis**: Uses git diff to analyze only the changes you've made
- **Backend API Integration**: Configurable backend API endpoint for intent detection
- **Real-time Notifications**: Shows notifications with the predicted intent
- **Status Bar Indicator**: Visual feedback during analysis
- **Smart Filtering**: Automatically skips binary files and ignored directories
- **Debouncing**: Prevents excessive API calls on rapid saves
- **Error Handling**: Graceful handling of network errors and edge cases

## Requirements

- VS Code version 1.107.0 or higher
- Git repository (the extension only works in git repositories)
- Backend API endpoint (configurable)

## Installation

### From Source

1. Clone or download this extension
2. Open the extension folder in VS Code
3. Run `npm install` to install dependencies
4. Press `F5` to launch the Extension Development Host

### Package Installation

1. Build the extension: `npm run package`
2. Install the generated `.vsix` file in VS Code

## Configuration

The extension can be configured via VS Code settings (File > Preferences > Settings, then search for "Commit Intent Detector").

### Settings

- **`commitIntentDetector.apiUrl`** (default: `https://localhost:7183/api/Commit/analyze`)
  - The URL of the backend API endpoint for commit intent analysis
  - Must accept POST requests with JSON body: `{ diff: string }`
  - Must return JSON response: `{ intent: string }`

- **`commitIntentDetector.timeout`** (default: `30000`)
  - Timeout in milliseconds for API requests
  - Range: 1000-300000

- **`commitIntentDetector.enabled`** (default: `true`)
  - Enable or disable commit intent detection

- **`commitIntentDetector.debounceDelay`** (default: `1000`)
  - Delay in milliseconds before processing file saves
  - Prevents rapid API calls when saving multiple files quickly
  - Range: 0-10000

- **`commitIntentDetector.showStatusBar`** (default: `true`)
  - Show status bar indicator during analysis

- **`commitIntentDetector.allowInsecureSSL`** (default: `false`)
  - Allow insecure SSL certificates (self-signed certificates)
  - **WARNING**: Only use this for development with localhost/self-signed certificates
  - Disables SSL certificate verification
  - **Never enable this in production environments**

### Backend API Requirements

Your backend API should:

1. Accept POST requests at the configured endpoint
2. Expect a JSON body with the following format:
   ```json
   {
     "diff": "git diff output string"
   }
   ```
3. Return a JSON response with the following format:
   ```json
   {
     "intent": "Bug Fix"
   }
   ```

## Usage

1. Make sure you're working in a git repository
2. Make changes to a tracked file
3. Save the file (Ctrl+S / Cmd+S)
4. Wait a moment (debounce delay)
5. A notification will appear showing the predicted commit intent
6. The status bar will show the analysis progress and result

The extension automatically activates when VS Code starts and listens for file save events. No manual commands needed!

## How It Works

1. **File Save Event**: When you save a file, the extension captures the event
2. **Git Repository Check**: Verifies the file is in a git repository
3. **Git Diff Extraction**: Runs `git diff` to get only the changes
4. **API Request**: Sends the diff to your backend API
5. **Intent Detection**: Backend analyzes the diff and returns intent
6. **Notification**: A notification appears showing the predicted commit intent

## Project Structure

```
commit-intent-detector/
├── extension.js          # Main extension entry point
├── package.json          # Extension manifest and dependencies
├── README.md            # This file
├── CHANGELOG.md         # Version history
└── test/                # Test files
```

## Development

### Running the Extension

1. Open this folder in VS Code
2. Press `F5` to open a new window with the extension loaded
3. The extension will be active in the Extension Development Host window
4. Make changes to a file in a git repository and save to test

### Debugging

- Set breakpoints in `extension.js`
- Use the Debug Console to see logs
- Check the Output panel for extension messages
- View logs: View > Output > Select "Log (Extension Host)"

### Building

```bash
npm install
npm run package
```

This creates a `.vsix` file that can be installed in VS Code.

## File Filtering

The extension automatically skips:

- Binary files (images, executables, archives, etc.)
- Files in common ignore directories (`node_modules`, `.git`, `dist`, `build`, etc.)
- Untracked git files
- Files with no changes (empty diff)
- Non-file documents (untitled files, etc.)

## Error Handling

The extension handles various error scenarios:

- **Backend unreachable**: Shows clear error message with API URL
- **Network timeout**: Configurable timeout with clear error message
- **Invalid API response**: Validates response format and shows error
- **Not a git repository**: Silently skips (logged to console)
- **Empty diff**: Silently skips (no changes detected)
- **Large diffs**: Skips diffs larger than 5MB to prevent performance issues

## Known Limitations

- Only works in git repositories
- Requires the backend API to be running and accessible
- Large diffs (>5MB) are skipped
- Binary files are automatically excluded
- Only analyzes tracked git files

## Troubleshooting

### SSL Certificate Errors

If you encounter an error like "unable to verify the first certificate" when using HTTPS with a self-signed certificate:

1. **For Development (Self-Signed Certificates)**:
   - Open VS Code Settings (File > Preferences > Settings)
   - Search for "Commit Intent Detector"
   - Enable `commitIntentDetector.allowInsecureSSL`
   - **Warning**: Only use this for local development with self-signed certificates

2. **For Production**:
   - Use a valid SSL certificate from a trusted Certificate Authority
   - Do not enable `allowInsecureSSL` in production

### Installation Issues

If you see errors about missing `undici` module:
- Run `npm install` to install all dependencies
- Make sure you're in the extension directory

## Release Notes

### 0.0.1

Initial release of Commit Intent Detector:
- Automatic commit intent detection on file save
- Backend API integration
- Real-time notifications
- Status bar indicator
- Configurable settings
- Smart file filtering
- Debouncing for performance
- Comprehensive error handling

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues, questions, or feature requests, please open an issue on [GitHub](https://github.com/Mohammed-3tef/Commit_Intent_Detector/issues).

---

**Enjoy coding with better commit intent awareness!**