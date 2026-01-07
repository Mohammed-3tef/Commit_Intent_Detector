/**
 * File save event handler
 */

const vscode = require('vscode');
const { getConfig } = require('./config');
const { shouldProcessFile } = require('./file-filter');
const { isGitRepository, getGitDiff } = require('./git-utils');
const { analyzeCommitIntent } = require('./api-client');
const { updateStatusBar, hideStatusBar } = require('./status-bar');
const { processAndDisplayIntent } = require('./intent-processor');

let debounceTimer = null;

/**
 * Clear the debounce timer
 */
function clearDebounceTimer() {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
}

/**
 * Handle file save event
 * @param {vscode.TextDocument} document - The saved document
 */
async function handleFileSave(document) {
  const config = getConfig();
  
  if (!config.enabled) {
    console.log('CommiTect is disabled');
    return;
  }

  const filePath = document.uri.fsPath;
  console.log('File saved:', filePath);

  // Skip untitled files
  if (document.uri.scheme !== 'file') {
    console.log('Skipping non-file document:', document.uri.scheme);
    return;
  }

  // Filter files
  if (!shouldProcessFile(filePath)) {
    return;
  }

  // Clear previous debounce timer
  clearDebounceTimer();

  // Debounce the processing
  debounceTimer = setTimeout(async () => {
    debounceTimer = null; // Clear timer reference after it fires
    try {
      updateStatusBar('$(sync~spin) Analyzing commit intent...', undefined);

      const isGit = await isGitRepository(filePath);
      if (!isGit) {
        console.log('File is not in a git repository, skipping intent detection');
        hideStatusBar();
        return;
      }

      const diff = await getGitDiff(filePath);
      if (!diff || diff.trim().length === 0) {
        console.log('Diff is empty, skipping intent detection');
        hideStatusBar();
        return;
      }

      console.log('Git diff retrieved, length:', diff.length, 'characters');

      const intent = await analyzeCommitIntent(diff, config);
      console.log('Detected intent:', intent);

      processAndDisplayIntent(intent);

    } catch (error) {
      console.error('Error detecting commit intent:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      vscode.window.showErrorMessage(`Failed to detect commit intent: ${errorMessage}`);
      hideStatusBar();
    }
  }, config.debounceDelay);
}

module.exports = {
  handleFileSave,
  clearDebounceTimer
};
