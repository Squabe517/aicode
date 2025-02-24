import * as vscode from 'vscode';

/**
 * Finds all references to a given symbol across the entire project.
 *
 * @param symbol - The symbol to search for.
 * @returns A list of locations where the symbol is referenced.
 */
export const executeReferenceFinder = async (symbol: string): Promise<vscode.Location[]> => {
  const references: vscode.Location[] = [];
  const workspaceFiles = await vscode.workspace.findFiles('**/*.{ts,js,py,java,cpp,cs,go,rb}', '**/node_modules/**');

  for (const file of workspaceFiles) {
    const document = await vscode.workspace.openTextDocument(file);
    const positions = await findSymbolPositions(document, symbol);

    for (const position of positions) {
      const foundReferences = await vscode.commands.executeCommand<vscode.Location[]>(
        'vscode.executeReferenceProvider',
        document.uri,
        position
      );

      if (foundReferences) {
        references.push(...foundReferences);
      }
    }
  }

  return references;
};

/**
 * Finds all positions of a given symbol within a document.
 *
 * @param document - The VS Code document to search in.
 * @param symbol - The symbol to find.
 * @returns A list of positions where the symbol appears.
 */
async function findSymbolPositions(document: vscode.TextDocument, symbol: string): Promise<vscode.Position[]> {
  const positions: vscode.Position[] = [];
  const text = document.getText();
  const regex = new RegExp(`\\b${symbol}\\b`, 'g');
  let match;

  while ((match = regex.exec(text)) !== null) {
    const position = document.positionAt(match.index);
    positions.push(position);
  }

  return positions;
}
