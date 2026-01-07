/**
 * Status bar management
 */

const vscode = require('vscode');
const { getConfig } = require('./config');

let statusBarItem = null;

/**
 * Initialize the status bar item
 * @param {vscode.ExtensionContext} context - The extension context
 */
function initializeStatusBar(context) {
  if (!statusBarItem) {
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.tooltip = 'CommiTect';
    context.subscriptions.push(statusBarItem);
  }
}

/**
 * Update the status bar with text and optional command
 * @param {string} text - The text to display
 * @param {string} [command] - Optional command to execute on click
 */
function updateStatusBar(text, command) {
  if (statusBarItem && getConfig().showStatusBar) {
    statusBarItem.text = text;
    if (command) {
      statusBarItem.command = command;
    }
    statusBarItem.show();
  }
}

/**
 * Hide the status bar item
 */
function hideStatusBar() {
  if (statusBarItem) {
    statusBarItem.hide();
  }
}

module.exports = {
  initializeStatusBar,
  updateStatusBar,
  hideStatusBar
};
