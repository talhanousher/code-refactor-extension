import * as vscode from 'vscode';
import axios from 'axios';
import { CodeHistory } from './codeHistory';

export function activate(context: vscode.ExtensionContext) {
  const codeHistory = new CodeHistory();

  vscode.workspace.onDidChangeTextDocument((event) => {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      console.log(editor.document.getText());
      codeHistory.recordChange(editor.document.getText());
    }
  });

  // Register rewind command
  const rewindCommand = vscode.commands.registerCommand('extension.rewindCode', async () => {
    const newCode = codeHistory.rewind(1);
    if (newCode) {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        editor.edit((editBuilder) => {
          const fullRange = new vscode.Range(
            editor.document.positionAt(0),
            editor.document.positionAt(editor.document.getText().length)
          );
          editBuilder.replace(fullRange, newCode);
        });
      }
    } else {
      vscode.window.showInformationMessage('No previous code state to rewind to.');
    }
  });

  // Register fast-forward command
  const forwardCommand = vscode.commands.registerCommand('extension.fastForwardCode', async () => {
    const newCode = codeHistory.fastForward(1);
    if (newCode) {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        editor.edit((editBuilder) => {
          const fullRange = new vscode.Range(
            editor.document.positionAt(0),
            editor.document.positionAt(editor.document.getText().length)
          );
          editBuilder.replace(fullRange, newCode);
        });
      }
    } else {
      vscode.window.showInformationMessage('No future code state to fast forward to.');
    }
  });

  const fixCommand = vscode.commands.registerCommand('extension.refactorCode', async () => {
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
      const response = await axios.post('http://localhost:3000/ai/refactor/open-route', {
        code: selectedText,
        language,
      });

      const refactoredCode = response.data.refactoredCode;

      // Replace selected text with refactored code
      editor.edit((editBuilder) => {
        editBuilder.replace(selection, refactoredCode);
      });

      vscode.window.showInformationMessage('Code refactored successfully!');
    } catch (error) {
      vscode.window.showErrorMessage('Failed to refactor code.' + error);
      console.error(error);
    }
  });

  // Add Status Bar Buttons
  const rewindItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  rewindItem.text = `$(history) Rewind`;
  rewindItem.command = 'extension.rewindCode';
  rewindItem.show();

  const forwardItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99);
  forwardItem.text = `$(debug-step-over) Fast Forward`;
  forwardItem.command = 'extension.fastForwardCode';
  forwardItem.show();

  const fixItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 98);
  fixItem.text = `$(lightbulb) AI Fix`;
  fixItem.command = 'extension.refactorCode';
  fixItem.show();

  context.subscriptions.push(rewindCommand, forwardCommand, rewindItem, forwardItem, fixCommand, fixItem);
}

export function deactivate() {
  console.log('Extension Deactivated!');
}
