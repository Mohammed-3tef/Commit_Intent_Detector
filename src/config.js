/**
 * Configuration management for the extension
 */

const vscode = require('vscode');
const { DEBOUNCE_DELAY } = require('./constants');

/**
 * Get the extension configuration
 * @returns {Object} Configuration object
 */
function getConfig() {
  const config = vscode.workspace.getConfiguration('commitIntentDetector');
  return {
    apiUrl: config.get('apiUrl', 'http://commitintentdetector.runasp.net/api/Commit/analyze'),
    timeout: config.get('timeout', 30000),
    enabled: config.get('enabled', true),
    debounceDelay: config.get('debounceDelay', DEBOUNCE_DELAY),
    showStatusBar: config.get('showStatusBar', true),
    allowInsecureSSL: config.get('allowInsecureSSL', false)
  };
}

module.exports = {
  getConfig
};
