const vscode = require('vscode');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const path = require('path');
const fs = require('fs');
const https = require('https');

let fetch;
let statusBarItem;
let debounceTimer;
const DEBOUNCE_DELAY = 1000; // 1 second debounce to prevent rapid API calls
const MAX_DIFF_SIZE = 5 * 1024 * 1024; // 5MB max diff size
const BINARY_FILE_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.svg',
  '.pdf', '.zip', '.tar', '.gz', '.7z', '.rar',
  '.exe', '.dll', '.so', '.dylib',
  '.mp3', '.mp4', '.avi', '.mov', '.wmv',
  '.woff', '.woff2', '.ttf', '.eot',
  '.bin', '.dat', '.db', '.sqlite'
]);

async function initializeFetch() {
  if (!fetch) {
    fetch = (await import('node-fetch')).default;
  }
}

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

function shouldProcessFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  
  // Skip binary files
  if (BINARY_FILE_EXTENSIONS.has(ext)) {
    console.log('Skipping binary file:', filePath);
    return false;
  }

  // Skip files in node_modules, .git, and other common ignore directories
  const normalizedPath = filePath.replace(/\\/g, '/');
  const ignorePatterns = [
    '/node_modules/',
    '/.git/',
    '/.vscode/',
    '/dist/',
    '/build/',
    '/.next/',
    '/coverage/',
    '/.nyc_output/'
  ];

  if (ignorePatterns.some(pattern => normalizedPath.includes(pattern))) {
    console.log('Skipping ignored directory:', filePath);
    return false;
  }

  return true;
}

async function isGitRepository(filePath) {
  try {
    const fileDir = path.dirname(filePath);
    const { stdout } = await execAsync('git rev-parse --git-dir', {
      cwd: fileDir,
      timeout: 5000,
      maxBuffer: 1024 * 1024
    });
    return stdout.trim().length > 0;
  } catch (error) {
    console.log('Not a git repository:', filePath);
    return false;
  }
}

async function getGitDiff(filePath) {
  try {
    const fileDir = path.dirname(filePath);
    const repoRootResult = await execAsync('git rev-parse --show-toplevel', {
      cwd: fileDir,
      timeout: 5000,
      maxBuffer: 1024 * 1024
    });
    const repoRoot = repoRootResult.stdout.trim();
    
    if (!repoRoot) {
      console.log('Could not determine git repository root');
      return '';
    }

    // Get relative path from repo root, normalizing path separators
    const relativePath = path.relative(repoRoot, filePath).replace(/\\/g, '/');
    
    // Check if file is tracked by git
    try {
      await execAsync(`git ls-files --error-unmatch "${relativePath}"`, {
        cwd: repoRoot,
        timeout: 5000,
        maxBuffer: 1024 * 1024
      });
    } catch (error) {
      console.log('File not tracked by git:', filePath);
      return '';
    }

    // Get diff for the file
    const diffResult = await execAsync(`git diff -- "${relativePath}"`, {
      cwd: repoRoot,
      timeout: 10000,
      maxBuffer: MAX_DIFF_SIZE
    });
    
    const diff = diffResult.stdout;
    
    // Check diff size
    if (diff.length > MAX_DIFF_SIZE) {
      console.warn('Diff too large, skipping:', diff.length, 'bytes');
      return '';
    }

    return diff;
  } catch (error) {
    if (error.code === 1) {
      // Exit code 1 from git diff means no changes
      console.log('No diff found (file unchanged or not in git):', filePath);
      return '';
    }
    console.error('Error getting git diff:', error);
    throw error;
  }
}

async function analyzeCommitIntent(diff) {
  await initializeFetch();
  const config = getConfig();
  
  console.log('Sending diff to API:', config.apiUrl, 'Size:', diff.length);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);
    
    try {
      const fetchOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ diff }),
        signal: controller.signal
      };

      // Handle insecure SSL for self-signed certificates (development only)
      if (config.allowInsecureSSL && config.apiUrl.startsWith('https://')) {
        try {
          // node-fetch v3 uses undici internally, use undici Agent to bypass SSL verification
          const { Agent } = require('undici');
          fetchOptions.agent = new Agent({
            connect: {
              rejectUnauthorized: false
            }
          });
          console.warn('WARNING: SSL certificate verification is disabled. This should only be used for development with self-signed certificates!');
        } catch (error) {
          throw new Error('Failed to load undici module. Please run "npm install" to install dependencies.');
        }
      }

      const response = await fetch(config.apiUrl, fetchOptions);

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (!data || typeof data.intent !== 'string') {
        throw new Error('Invalid response format: expected { intent: string }');
      }

      return data.intent;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout: Cannot reach backend API at ${config.apiUrl} within ${config.timeout / 1000} seconds.`);
    }
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || 
        error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED') ||
        error.message.includes('ENOTFOUND')) {
      throw new Error(`Cannot reach backend API at ${config.apiUrl}. Please check if the server is running and the URL is correct.`);
    }
    if (error.message.includes('certificate') || error.message.includes('UNABLE_TO_VERIFY_LEAF_SIGNATURE') ||
        error.message.includes('unable to verify the first certificate')) {
      throw new Error(`SSL certificate verification failed. If using a self-signed certificate, enable 'commitIntentDetector.allowInsecureSSL' in settings (development only).`);
    }
    throw error;
  }
}

function updateStatusBar(text, command) {
  if (statusBarItem && getConfig().showStatusBar) {
    statusBarItem.text = text;
    statusBarItem.command = command;
    statusBarItem.show();
  }
}

function hideStatusBar() {
  if (statusBarItem) {
    statusBarItem.hide();
  }
}

async function handleFileSave(document) {
  const config = getConfig();
  
  if (!config.enabled) {
    console.log('Commit Intent Detector is disabled');
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
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  // Debounce the processing
  debounceTimer = setTimeout(async () => {
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

      const intent = await analyzeCommitIntent(diff);
      console.log('Detected intent:', intent);

      const rawIntent = intent;
      const lines = rawIntent.split('\n');

      let intentType = '';
      let intentMessage = '';

      for (const line of lines) {
        if (line.startsWith('Intent:')) {
          intentType = line.replace('Intent:', '').trim();
        } else if (line.startsWith('Message:')) {
          intentMessage = line.replace('Message:', '').trim();
        }
      }

      const message = `${intentType}: ${intentMessage}`;
      vscode.window.showInformationMessage(message, 'Copy')
        .then(selection => {
          if (selection === 'Copy') {
            vscode.env.clipboard.writeText(message);
            vscode.window.showInformationMessage('Copied to clipboard');
          }
        });


      updateStatusBar(`$(check) Intent: ${intent}`, undefined);
      
      // Hide status bar after 3 seconds
      setTimeout(() => {
        hideStatusBar();
      }, 3000);

    } catch (error) {
      console.error('Error detecting commit intent:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      vscode.window.showErrorMessage(`Failed to detect commit intent: ${errorMessage}`);
      hideStatusBar();
    }
  }, config.debounceDelay);
}

function activate(context) {
  console.log('Commit Intent Detector extension is now active!');

  // 🔔 Notification on startup
  vscode.window.showInformationMessage('Commit Intent Detector is active!');
  
  // Initialize fetch
  initializeFetch().catch(err => {
    console.error('Failed to initialize fetch:', err);
  });

  // Create status bar item
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.tooltip = 'Commit Intent Detector';
  context.subscriptions.push(statusBarItem);

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

function deactivate() {
  console.log('Commit Intent Detector extension is now deactivated.');
  
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  
  hideStatusBar();
}

module.exports = { activate, deactivate };