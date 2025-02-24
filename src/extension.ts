// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from "fs";
import * as path from "path";


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "aicode" is now active!');


	const workspaceFolders = vscode.workspace.workspaceFolders;
  
  if (workspaceFolders && workspaceFolders.length > 0) {
    const projectRoot = workspaceFolders[0].uri.fsPath;
    const configPath = path.join(projectRoot, ".ai-code-config.json");

    if (fs.existsSync(configPath)) {
      vscode.window.showInformationMessage("Project detected! Using .ai-code-config.json");
      loadConfig(configPath);
    } else {
      vscode.window.showWarningMessage("No .ai-code-config.json found in the workspace.");
    }
  } else {
    vscode.window.showErrorMessage("No workspace folder is open.");
  }



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

function loadConfig(configPath: string) {
  try {
    const rawConfig = fs.readFileSync(configPath, "utf8");
    const config = JSON.parse(rawConfig);
    vscode.window.showInformationMessage(`Loaded config: ${JSON.stringify(config)}`);
  } catch (error) {
    vscode.window.showErrorMessage("Failed to read config file.");
  }
}

// This method is called when your extension is deactivated
export function deactivate() {}


