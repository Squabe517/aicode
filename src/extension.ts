// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from "fs";
import * as path from "path";
import { ConfigManager } from "./features/ConfigManager";
import { ChatGPT } from "./features/ChatGPT";
import { executeReferenceFinder } from "./features/ReferenceFinder";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "aicode" is now active!');


	// Register the ConfigManager`
	// const configManager = new ConfigManager(context);

	// Register the ChatGPT class
	const chatGPT = new ChatGPT(context);

	// register a command to extract symbols from selected code
	const extractSymbols = vscode.commands.registerCommand('aicode.extractSymbols', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active text editor found.');
			return;
		}

		const selection = editor.selection;
		const text = editor.document.getText(selection);

		if (!text) {
			vscode.window.showErrorMessage('No text selected.');
			return;
		}

		const symbols = chatGPT.getSymbols(text);

		console.log(symbols);
	});

	context.subscriptions.push(extractSymbols);

	const findReferences = vscode.commands.registerCommand('aicode.findReferences', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active text editor found.');
			return;
		}
	
		const selection = editor.selection;
		const selectedText = editor.document.getText(selection).trim();
	
		if (!selectedText) {
			vscode.window.showErrorMessage('No text selected.');
			return;
		}
	
		vscode.window.setStatusBarMessage(`Searching for references of "${selectedText}"...`, 5000);
	
		try {
			// Use VS Code’s built-in reference finder (MUCH FASTER)
			const position = selection.active;
			const references = await vscode.commands.executeCommand<vscode.Location[]>(
				'vscode.executeReferenceProvider',
				editor.document.uri,
				position
			);
	
			if (!references || references.length === 0) {
				vscode.window.showInformationMessage(`No references found for "${selectedText}".`);
				return;
			}
	
			// Format references for display
			const referenceItems = references.map((ref) => ({
				label: `📄 ${vscode.workspace.asRelativePath(ref.uri)}`,
				description: `Line ${ref.range.start.line + 1}, Column ${ref.range.start.character + 1}`,
				reference: ref,
			}));
	
			// Show references in QuickPick for easy selection
			const pickedReference = await vscode.window.showQuickPick(referenceItems, {
				placeHolder: `Found ${references.length} references. Select one to open.`,
			});
	
			if (pickedReference) {
				await vscode.window.showTextDocument(pickedReference.reference.uri, {
					selection: pickedReference.reference.range,
					preview: true,
				});
			}
		} catch (error: any) {
			vscode.window.showErrorMessage(`Error finding references: ${error.message}`);
		}
	});
	
	// Add command to context subscriptions
	context.subscriptions.push(findReferences);



	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('aicode.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from aicode!');
	});

	context.subscriptions.push(disposable);
}



// This method is called when your extension is deactivated
export function deactivate() {}


