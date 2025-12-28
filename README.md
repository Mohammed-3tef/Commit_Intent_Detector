# Commit Intent Detector

A VS Code extension that automatically detects the intent of your code changes when saving files. It uses a backend API to analyze git diffs and predict whether your changes represent a **bug fix**, **new feature**, **refactor**, **risky commit**, or **documentation/test update**.

---

## Features

- **Automatic Detection** – Analyze files automatically when saving
- **Git Diff Analysis** – Only analyze your actual code changes
- **Backend API Integration** – Configurable API endpoint for intent detection
- **Real-time Notifications** – Instant notifications with predicted commit intent
- **Status Bar Indicator** – Visual feedback during analysis
- **Smart Filtering** – Skip binary files and ignored directories automatically
- **Debouncing** – Prevent excessive API calls on rapid file saves
- **Error Handling** – Graceful handling of network errors and edge cases

---

## Requirements

- VS Code 1.107.0 or higher
- Git repository (extension works only in git repositories)
- Running backend API endpoint (configurable)

---

## Installation

### From Source

1. Clone or download this extension
2. Open the extension folder in VS Code
3. Run `npm install` to install dependencies
4. Press `F5` to launch the Extension Development Host

### Package Installation

1. Build the extension: `npm run package`
2. Install the generated `.vsix` file in VS Code

---

## Configuration

Configure via VS Code settings (File > Preferences > Settings > search "Commit Intent Detector").

### Key Settings

- **`commitIntentDetector.apiUrl`** – Backend API endpoint (default: `https://localhost:7183/api/Commit/analyze`)
- **`commitIntentDetector.timeout`** – API request timeout in ms (default: 30000)
- **`commitIntentDetector.enabled`** – Enable/disable detection (default: true)
- **`commitIntentDetector.debounceDelay`** – Delay before processing saves (default: 1000ms)
- **`commitIntentDetector.showStatusBar`** – Show status bar indicator (default: true)
- **`commitIntentDetector.allowInsecureSSL`** – Allow self-signed certificates (development only)

### Backend API Format

**Request**:
```json
{
  "diff": "git diff output string"
}
````

**Response**:

```json
{
  "intent": "Bug Fix"
}
```

---

## Usage

1. Work in a git repository
2. Make changes to a tracked file
3. Save the file
4. Wait briefly (debounce delay)
5. Receive a notification showing predicted commit intent
6. Status bar shows analysis progress and result

> The extension automatically activates on VS Code startup; no manual commands needed.

---

## How It Works

1. **File Save Event** – Triggered when saving
2. **Git Repository Check** – Confirms file is in git repo
3. **Git Diff Extraction** – Captures only the changes
4. **API Request** – Sends diff to backend
5. **Intent Detection** – Backend predicts commit intent
6. **Notification** – Shows intent via popup and status bar

---

## Project Structure

```
commit-intent-detector/
├── extension.js          # Main extension entry point
├── package.json          # Extension manifest
├── README.md             # Documentation
├── CHANGELOG.md          # Version history
└── test/                 # Test files
```

---

## Development

### Running

1. Open the folder in VS Code
2. Press `F5` to launch Extension Development Host
3. Make changes and save to test intent detection

### Debugging

* Set breakpoints in `extension.js`
* Check logs in Debug Console and Output panel

### Building

```bash
npm install
npm run package
```

Generates a `.vsix` file to install in VS Code.

---

## File Filtering

Skips automatically:

* Binary files (images, executables, archives, etc.)
* Common ignore directories (`node_modules`, `.git`, `dist`, etc.)
* Untracked git files
* Files with no changes (empty diff)
* Non-file documents (untitled files)

---

## Error Handling

* **Backend unreachable** – Clear error message with API URL
* **Network timeout** – Configurable timeout
* **Invalid API response** – Validates response format
* **Not a git repository / Empty diff** – Skipped silently
* **Large diffs (>5MB)** – Skipped to prevent performance issues

---

## Known Limitations

* Works only in git repositories
* Requires running backend API
* Large diffs skipped
* Binary files excluded
* Only analyzes tracked git files

---

## Troubleshooting

### SSL Certificate Errors

* **Development (Self-Signed)**: Enable `commitIntentDetector.allowInsecureSSL` in settings
* **Production**: Use a trusted SSL certificate

### Installation Issues

* Missing `undici` module: run `npm install` in extension directory

---

## Release Notes

### 0.0.1

* Automatic commit intent detection on file save
* Backend API integration
* Real-time notifications
* Status bar indicator
* Configurable settings
* Smart file filtering
* Debouncing for performance
* Comprehensive error handling

---

## License

MIT

---

## Contributing

Contributions welcome! Submit a Pull Request on [GitHub](https://github.com/Mohammed-3tef/Commit_Intent_Detector).

---

**Enjoy coding with better commit intent awareness!**