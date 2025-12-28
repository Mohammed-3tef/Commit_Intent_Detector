/**
 * Intent processing and notification utilities
 */

const vscode = require('vscode');
const { STATUS_BAR_DISPLAY_DURATION } = require('./constants');
const { updateStatusBar, hideStatusBar } = require('./status-bar');

/**
 * Parse the intent string into type and message
 * @param {string} intent - The raw intent string from API
 * @returns {{type: string, message: string}} Parsed intent with type and message
 */
function parseIntent(intent) {
  const lines = intent.split('\n');
  let intentType = '';
  let intentMessage = '';

  for (const line of lines) {
    if (line.startsWith('Intent:')) {
      intentType = line.replace('Intent:', '').trim();
    } else if (line.startsWith('Message:')) {
      intentMessage = line.replace('Message:', '').trim();
    }
  }

  return { type: intentType, message: intentMessage };
}

/**
 * Show a notification with the detected intent
 * @param {string} intentType - The intent type
 * @param {string} intentMessage - The intent message
 */
function showIntentNotification(intentType, intentMessage) {
  const message = `${intentType}: ${intentMessage}`;
  vscode.window.showInformationMessage(message, 'Copy')
    .then(selection => {
      if (selection === 'Copy') {
        vscode.env.clipboard.writeText(message);
        vscode.window.showInformationMessage('Copied to clipboard');
      }
    });
}

/**
 * Process and display the detected commit intent
 * @param {string} intent - The raw intent string from API
 */
function processAndDisplayIntent(intent) {
  const { type, message } = parseIntent(intent);
  
  if (type && message) {
    showIntentNotification(type, message);
  } else {
    // Fallback to showing raw intent if parsing fails
    showIntentNotification('Intent', intent);
  }

  updateStatusBar(`$(check) Intent: ${intent}`, undefined);
  
  // Hide status bar after delay
  setTimeout(() => {
    hideStatusBar();
  }, STATUS_BAR_DISPLAY_DURATION);
}

module.exports = {
  parseIntent,
  showIntentNotification,
  processAndDisplayIntent
};
