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

    const document = editor.document;
    const selection = editor.selection;
    const selectedText = document.getText(selection);
    const language = document.languageId;
    const originalFileUri = document.uri; // Store original file URI

    if (!selectedText) {
      vscode.window.showWarningMessage('Please select some code to refactor.');
      return;
    }

    try {
      // Call NestJS API
      const response = await axios.post('http://localhost:3000/ai/refactor/open-route', {
        code: selectedText,
        language,
      });

      const refactoredCode = response.data.refactoredCode;

      // Show diff view using untitled URIs
      const originalUri = vscode.Uri.parse(`untitled:original`);
      const refactoredUri = vscode.Uri.parse(`untitled:refactored`);

      // Create virtual documents for diff view
      const editOriginal = new vscode.WorkspaceEdit();
      editOriginal.insert(originalUri, new vscode.Position(0, 0), selectedText);
      await vscode.workspace.applyEdit(editOriginal);

      const editRefactored = new vscode.WorkspaceEdit();
      editRefactored.insert(refactoredUri, new vscode.Position(0, 0), refactoredCode);
      await vscode.workspace.applyEdit(editRefactored);

      // Open diff view
      await vscode.commands.executeCommand('vscode.diff', originalUri, refactoredUri, 'Code Refactor Preview');

      // Ask user if they want to apply changes
      const applyChanges = await vscode.window.showQuickPick(["Apply Changes", "Cancel"], {
        placeHolder: "Do you want to apply the refactored code?",
      });

      if (applyChanges === "Apply Changes") {
        // Replace selected text in original document
        const edit = new vscode.WorkspaceEdit();
        edit.replace(document.uri, selection, refactoredCode);
        await vscode.workspace.applyEdit(edit);

        // Close only the diff view (not all editors)
        await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
        await vscode.commands.executeCommand("workbench.action.closeActiveEditor");

        vscode.window.showInformationMessage("Code refactored successfully!");
      } else {
        await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
        await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
      }
    } catch (error) {
      vscode.window.showErrorMessage('Failed to refactor code: ' + error);
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
