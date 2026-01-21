/**
 * Main extension entry point
 * CommiTect - Manual commit message generator from repository changes
 */

const vscode = require('vscode');
const { initializeFetch } = require('./src/api-client');
const { getConfig } = require('./src/config');
const { initializeStatusBar, updateStatusBar, hideStatusBar } = require('./src/status-bar');
const { handleManualTrigger } = require('./src/commit-handler');

/**
 * Activate the extension
 * @param {vscode.ExtensionContext} context - The extension context
 */
function activate(context) {
  console.log('CommiTect extension is now active!');

  // Notification on startup
  vscode.window.showInformationMessage('CommiTect is ready! Click the status bar or run the command.');
  
  // Initialize fetch
  initializeFetch().catch(err => {
    console.error('Failed to initialize fetch:', err);
  });

  // Initialize status bar with click command
  initializeStatusBar(context);
  updateStatusBar('$(git-commit) CommiTect', 'commitect.generateCommitMessage');

  // Register manual commit message generation command
  const generateCommand = vscode.commands.registerCommand('commitect.generateCommitMessage', async () => {
    await handleManualTrigger();
  });

  context.subscriptions.push(generateCommand);

  // Listen for configuration changes
  const configDisposable = vscode.workspace.onDidChangeConfiguration(event => {
    if (event.affectsConfiguration('commitIntentDetector')) {
      console.log('Configuration changed, reloading settings');
      if (!getConfig().showStatusBar) {
        hideStatusBar();
      } else {
        updateStatusBar('$(git-commit) CommiTect', 'commitect.generateCommitMessage');
      }
    }
  });

  context.subscriptions.push(configDisposable);
}

/**
 * Deactivate the extension
 */
function deactivate() {
  console.log('CommiTect extension is now deactivated.');
  
  // Hide status bar
  hideStatusBar();
}

module.exports = { activate, deactivate };