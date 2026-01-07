/**
 * Main extension entry point
 * CommiTect - Automatically detects commit intent from code changes
 */

const vscode = require('vscode');
const { initializeFetch } = require('./src/api-client');
const { getConfig } = require('./src/config');
const { initializeStatusBar, hideStatusBar } = require('./src/status-bar');
const { handleFileSave, clearDebounceTimer } = require('./src/file-handler');

/**
 * Activate the extension
 * @param {vscode.ExtensionContext} context - The extension context
 */
function activate(context) {
  console.log('CommiTect extension is now active!');

  // Notification on startup
  vscode.window.showInformationMessage('CommiTect is active!');
  
  // Initialize fetch
  initializeFetch().catch(err => {
    console.error('Failed to initialize fetch:', err);
  });

  // Initialize status bar
  initializeStatusBar(context);

  // Register file save listener
  const saveDisposable = vscode.workspace.onDidSaveTextDocument(async (document) => {
    await handleFileSave(document);
  });

  context.subscriptions.push(saveDisposable);

  // Listen for configuration changes
  const configDisposable = vscode.workspace.onDidChangeConfiguration(event => {
    if (event.affectsConfiguration('commitIntentDetector')) {
      console.log('Configuration changed, reloading settings');
      if (!getConfig().showStatusBar) {
        hideStatusBar();
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
  
  // Clear any pending debounce timer
  clearDebounceTimer();
  
  // Hide status bar
  hideStatusBar();
}

module.exports = { activate, deactivate };