"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const axios_1 = __importDefault(require("axios"));
const codeHistory_1 = require("./codeHistory");
function activate(context) {
    const codeHistory = new codeHistory_1.CodeHistory();
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
                    const fullRange = new vscode.Range(editor.document.positionAt(0), editor.document.positionAt(editor.document.getText().length));
                    editBuilder.replace(fullRange, newCode);
                });
            }
        }
        else {
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
                    const fullRange = new vscode.Range(editor.document.positionAt(0), editor.document.positionAt(editor.document.getText().length));
                    editBuilder.replace(fullRange, newCode);
                });
            }
        }
        else {
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
            const response = await axios_1.default.post('http://localhost:3000/ai/refactor/open-route', {
                code: selectedText,
                language,
            });
            const refactoredCode = response.data.refactoredCode;
            // Replace selected text with refactored code
            editor.edit((editBuilder) => {
                editBuilder.replace(selection, refactoredCode);
            });
            vscode.window.showInformationMessage('Code refactored successfully!');
        }
        catch (error) {
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
function deactivate() {
    console.log('Extension Deactivated!');
}
//# sourceMappingURL=extension.js.map