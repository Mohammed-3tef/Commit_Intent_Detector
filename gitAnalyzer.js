// استخدم .default لضمان التوافق مع النسخ الحديثة
const simpleGit = require('simple-git').default;
const git = simpleGit();

async function getStagedDiff() {
  try {
    const diff = await git.diff(['--cached']);
    return diff;
  } catch (error) {
    console.error('Error fetching git diff:', error);
    return '';
  }
}

module.exports = { getStagedDiff };
