const vscode = require('vscode');
const { getStagedDiff } = require('./gitAnalyzer');
const { detectIntent } = require('./intentClassifier');

function activate(context) {

  // Event listener عند كل save
  let saveDisposable = vscode.workspace.onDidSaveTextDocument(async (document) => {
    const diff = await getStagedDiff();
    if (!diff) return; // لو مفيش staged changes

    vscode.window.withProgress(
      { location: vscode.ProgressLocation.Notification, title: "Detecting Commit Intent..." },
      async () => {
        const intent = await detectIntent(diff);
        vscode.window.showInformationMessage(`Predicted Commit Intent: ${intent}`);
      }
    );
  });

  context.subscriptions.push(saveDisposable);
}

function deactivate() {}

module.exports = { activate, deactivate };
