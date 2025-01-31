import * as vscode from 'vscode';
import axios from 'axios';

export function activate(context: vscode.ExtensionContext) {
  console.log("Extension activated!");
  let disposable = vscode.commands.registerCommand('extension.refactorCode', async () => {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
      vscode.window.showErrorMessage('No active editor found');
      return;
    }

    const selection = editor.selection;
    const selectedText = editor.document.getText(selection);
    const language = editor.document.languageId; // Get current file language

    if (!selectedText) {
      vscode.window.showWarningMessage('Please select some code to refactor.');
      return;
    }

    try {
      // Call your NestJS API
      const response = await axios.post('http://localhost:3000/refactor/open-route', {
        code: selectedText,
        language
      });

      const refactoredCode = response.data.refactoredCode;

      // Replace selected text with refactored code
      editor.edit(editBuilder => {
        editBuilder.replace(selection, refactoredCode);
      });

      vscode.window.showInformationMessage('Code refactored successfully!');
    } catch (error) {
      vscode.window.showErrorMessage('Failed to refactor code.');
      console.error(error);
    }
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {
  console.log("Extension Deactivated!");
}
