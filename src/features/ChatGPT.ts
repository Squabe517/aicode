import * as vscode from 'vscode';
import OpenAI from 'openai';
import { ConfigManager } from './ConfigManager';
import { Config } from './Config';
import * as path from 'path';
import { executeReferenceFinder } from './ReferenceFinder';


/**
 * A class for interacting with the OpenAI ChatGPT API.
 *
 *
 */
export class ChatGPT {
  private openai: OpenAI;
  private configManager: ConfigManager;

  constructor(context: vscode.ExtensionContext) {
    this.configManager = new ConfigManager(context);
    const apiKey: string =
      vscode.workspace.getConfiguration('chatgpt').get('apiKey') || '';
    if (!apiKey) {
      vscode.window.showErrorMessage(
        'OpenAI API key is missing. Set it in settings: chatgpt.apiKey'
      );
    }
    this.openai = new OpenAI({ apiKey });

    const generateCode = vscode.commands.registerCommand(
      'aicode.generateCode',
      async () => {
        await this.generateCode();
      }
    );

    context.subscriptions.push(generateCode);
  }

  public async extractComment(
    text: string,
    lineNumber: number
  ): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: 'user',
            content: `Given the following code, find the most relevant comment that specifies what should be done at line number ${lineNumber}. If the comment is a part of a multi-line docstring, extract the entire docstring."

                  Instructions for ChatGPT:

                      Look for the nearest comment (#) or docstring (""" or ''') before or after the specified line number.
                      If a docstring applies to a function or class that encompasses the given line, return the full docstring.
                      If there are multiple comments around the line, select the most relevant one based on context.
                      Return only the extracted comment or docstring without any additional explanations.

      ${text}`,
          },
        ],
        temperature: 0.3,
      });

      return response.choices[0]?.message?.content?.trim() || '';
    } catch (error) {
      vscode.window.showErrorMessage(`ChatGPT API Error: ${error}`);
      return '';
    }
  }

  /**
   *
   *
   * This code detects the file extension of the active editor and retrieves the corresponding AI prompt from the configuration.
   * It then sets the developer prompt as the appropriate AI prompt.
   * Then it retrieves the docstring/comment/multi-line comment directly above the cursor and
   * outputs the AI response in the editor.
   *
   *
   * @param prompt
   *
   * @returns response
   */
  public async generateCode(): Promise<void> {
    const config: Config = this.configManager.getConfig();
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
      vscode.window.showErrorMessage('No active editor found.');
      return;
    }

    const document = editor.document;
    const text = document.getText();
    const fileExtension = path.extname(document.fileName);
    const prompt = config.getPrompt(fileExtension);
    console.log('Current file extension: ', fileExtension);
    console.log('Current prompt file extension: ', prompt);

    const position = editor.selection.active;
    const lineNumber = position.line + 1; // Convert to 1-based index

    const extractedComment = await this.extractComment(text, lineNumber);

    if (!extractedComment) {
        vscode.window.showErrorMessage('No relevant comment found.');
        return;
    }

    console.log('Extracted Comment: ', extractedComment);

    try {
      const response = await this.openai.chat.completions.create({
        model: config.model,
        messages: [{ role: 'user', content: `${prompt}

          Context:
          You are modifying an existing file and must ensure that the code is enhanced without introducing duplicate implementations.
          
          File to edit:
          ${text}
          
          Existing Code:
          (Provide a relevant snippet of existing code if possible to help ensure consistency)
          
          Comment to implement:
          ${extractedComment}
          
          Instructions:
          - Modify the existing code to incorporate the specified comment while maintaining consistency with the current structure and coding style.
          - Avoid duplicating functionality that already exists in the file.
          - Ensure that the changes are syntactically and logically correct.
          - If an equivalent implementation already exists, refine or optimize rather than duplicating.
          - Provide concise and well-documented changes where necessary.
          ` }],
        temperature: config.temperature,
        // max_tokens: config.maxTokens,
      });

      let completion = response.choices?.[0]?.message?.content?.trim();

      if (completion) {
        // Remove surrounding triple backticks if present
        completion = completion.replace(/^```[a-zA-Z]*\n/, '').replace(/```$/, '');

        await editor.edit((editBuilder: any) => {
          editor.selections.forEach((selection) => editBuilder.replace(selection, completion));
        });
      } else {
        vscode.window.showErrorMessage('No response received from ChatGPT.');
      }
    } catch (error: any) {
      vscode.window.showErrorMessage(`ChatGPT API Error: ${error.message || error}`);
    }
  }


  
}
