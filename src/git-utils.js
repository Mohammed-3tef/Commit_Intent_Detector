/**
 * Git repository utilities
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const { MAX_DIFF_SIZE, GIT_COMMAND_TIMEOUT } = require('./constants');

const execAsync = promisify(exec);

/**
 * Check if a file is in a git repository
 * @param {string} filePath - The file path to check
 * @returns {Promise<boolean>} True if the file is in a git repository
 */
async function isGitRepository(filePath) {
  try {
    const fileDir = path.dirname(filePath);
    const { stdout } = await execAsync('git rev-parse --git-dir', {
      cwd: fileDir,
      timeout: GIT_COMMAND_TIMEOUT,
      maxBuffer: 1024 * 1024
    });
    return stdout.trim().length > 0;
  } catch (error) {
    console.log('Not a git repository:', filePath);
    return false;
  }
}

/**
 * Get the git diff for a file
 * @param {string} filePath - The file path to get diff for
 * @returns {Promise<string>} The git diff output, or empty string if no diff
 */
async function getGitDiff(filePath) {
  try {
    const fileDir = path.dirname(filePath);
    const repoRootResult = await execAsync('git rev-parse --show-toplevel', {
      cwd: fileDir,
      timeout: GIT_COMMAND_TIMEOUT,
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
        timeout: GIT_COMMAND_TIMEOUT,
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

module.exports = {
  isGitRepository,
  getGitDiff
};
