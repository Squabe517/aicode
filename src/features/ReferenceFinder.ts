import * as vscode from 'vscode';

export const executeReferenceFinder = async (symbol: string): Promise<vscode.Location[]> => {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage('No active text editor found.');
    return [];
  }

  const position = editor.selection.active;
  const document = editor.document;

  // Directly use VS Code's reference finder (FASTER)
  const references = await vscode.commands.executeCommand<vscode.Location[]>(
    'vscode.executeReferenceProvider',
    document.uri,
    position
  );

  return references || [];
};

/**
 * Finds all implementations of the selected symbol.
 *
 * @param symbol - The symbol to search for.
 * @returns A list of locations where the symbol is implemented.
 */
export const executeImplementationFinder = async (symbol: string): Promise<vscode.Location[]> => {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage('No active text editor found.');
    return [];
  }

  const position = editor.selection.active;
  const document = editor.document;

  // Use VS Code's built-in implementation finder (FAST)
  const implementations = await vscode.commands.executeCommand<vscode.Location[]>(
    'vscode.executeImplementationProvider',
    document.uri,
    position
  );

  return implementations || [];
};