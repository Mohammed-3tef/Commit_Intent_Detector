/**
 * Git repository utilities
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const { MAX_DIFF_SIZE, GIT_COMMAND_TIMEOUT } = require('./constants');

const execAsync = promisify(exec);

/**
 * Get the git repository root for a workspace folder
 * @param {string} workspacePath - The workspace folder path
 * @returns {Promise<string|null>} The repository root path, or null if not a git repo
 */
async function getGitRepositoryRoot(workspacePath) {
  try {
    const { stdout } = await execAsync('git rev-parse --show-toplevel', {
      cwd: workspacePath,
      timeout: GIT_COMMAND_TIMEOUT,
      maxBuffer: 1024 * 1024
    });
    return stdout.trim();
  } catch (error) {
    console.log('Not a git repository:', workspacePath);
    return null;
  }
}

/**
 * Check if there are any changes in the repository
 * @param {string} repoRoot - The repository root path
 * @returns {Promise<boolean>} True if there are changes
 */
async function hasChanges(repoRoot) {
  try {
    // Check for both staged and unstaged changes
    const { stdout } = await execAsync('git status --porcelain', {
      cwd: repoRoot,
      timeout: GIT_COMMAND_TIMEOUT,
      maxBuffer: 1024 * 1024
    });
    return stdout.trim().length > 0;
  } catch (error) {
    console.error('Error checking git status:', error);
    return false;
  }
}

/**
 * Get all repository changes (both staged and unstaged)
 * @param {string} repoRoot - The repository root path
 * @returns {Promise<string>} Combined diff of all changes
 */
async function getAllRepositoryDiff(repoRoot) {
  try {
    let combinedDiff = '';
    
    // Get unstaged changes (working directory vs index)
    try {
      const unstagedResult = await execAsync('git diff', {
        cwd: repoRoot,
        timeout: 10000,
        maxBuffer: MAX_DIFF_SIZE
      });
      
      if (unstagedResult.stdout && unstagedResult.stdout.trim().length > 0) {
        combinedDiff += '=== UNSTAGED CHANGES ===\n\n';
        combinedDiff += unstagedResult.stdout;
        combinedDiff += '\n\n';
      }
    } catch (error) {
      console.log('No unstaged changes or error getting unstaged diff');
    }
    
    // Get staged changes (index vs HEAD)
    try {
      const stagedResult = await execAsync('git diff --cached', {
        cwd: repoRoot,
        timeout: 10000,
        maxBuffer: MAX_DIFF_SIZE
      });
      
      if (stagedResult.stdout && stagedResult.stdout.trim().length > 0) {
        combinedDiff += '=== STAGED CHANGES ===\n\n';
        combinedDiff += stagedResult.stdout;
        combinedDiff += '\n\n';
      }
    } catch (error) {
      console.log('No staged changes or error getting staged diff');
    }
    
    // Get untracked files
    try {
      const untrackedResult = await execAsync('git ls-files --others --exclude-standard', {
        cwd: repoRoot,
        timeout: GIT_COMMAND_TIMEOUT,
        maxBuffer: 1024 * 1024
      });
      
      if (untrackedResult.stdout && untrackedResult.stdout.trim().length > 0) {
        const untrackedFiles = untrackedResult.stdout.trim().split('\n');
        combinedDiff += '=== UNTRACKED FILES ===\n\n';
        combinedDiff += untrackedFiles.join('\n');
        combinedDiff += '\n\n';
      }
    } catch (error) {
      console.log('No untracked files or error getting untracked files');
    }
    
    // Check combined diff size
    if (combinedDiff.length > MAX_DIFF_SIZE) {
      console.warn('Combined diff too large:', combinedDiff.length, 'bytes');
      throw new Error(`Changes are too large (${(combinedDiff.length / 1024 / 1024).toFixed(2)} MB). Maximum size is ${MAX_DIFF_SIZE / 1024 / 1024} MB.`);
    }
    
    return combinedDiff.trim();
  } catch (error) {
    console.error('Error getting repository diff:', error);
    throw error;
  }
}

/**
 * Get a summary of changes in the repository
 * @param {string} repoRoot - The repository root path
 * @returns {Promise<Object>} Summary of changes
 */
async function getChangesSummary(repoRoot) {
  try {
    const { stdout } = await execAsync('git status --porcelain', {
      cwd: repoRoot,
      timeout: GIT_COMMAND_TIMEOUT,
      maxBuffer: 1024 * 1024
    });
    
    const lines = stdout.trim().split('\n').filter(line => line.length > 0);
    const summary = {
      total: lines.length,
      modified: 0,
      added: 0,
      deleted: 0,
      renamed: 0,
      untracked: 0
    };
    
    for (const line of lines) {
      const status = line.substring(0, 2);
      if (status.includes('M')) summary.modified++;
      if (status.includes('A')) summary.added++;
      if (status.includes('D')) summary.deleted++;
      if (status.includes('R')) summary.renamed++;
      if (status.includes('?')) summary.untracked++;
    }
    
    return summary;
  } catch (error) {
    console.error('Error getting changes summary:', error);
    return { total: 0, modified: 0, added: 0, deleted: 0, renamed: 0, untracked: 0 };
  }
}

module.exports = {
  getGitRepositoryRoot,
  hasChanges,
  getAllRepositoryDiff,
  getChangesSummary
};