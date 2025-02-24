import * as vscode from 'vscode';
import * as fs from "fs";
import * as path from "path";
import { Config } from "./Config";



/**
 * Manages loading, monitoring, and creating a configuration file for the extension.
 * 
 * This class handles:
 * - Loading a `.myconfig.json` file from the workspace root.
 * - Watching for changes in the configuration file.
 * - Providing a command to generate a default config file if one is missing.
 *
 * @property {string} configPath - The full path to the configuration file.
 * @property {vscode.FileSystemWatcher | null} watcher - Watches the config file for changes.
 * @property {vscode.ExtensionContext} context - The extension context for managing subscriptions.
 * @property {Record<string, unknown>} config - The current configuration values.
 */

export class ConfigManager {
  private configPath: string;
  private watcher: vscode.FileSystemWatcher | null = null;
  private context: vscode.ExtensionContext;
  private config: Config;
  
  /**
   * Initializes the ConfigManager.
   *
   * @param context - The extension context, used for managing subscriptions.
   */
  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.configPath = this.getConfigPath();
    this.config = new Config({});

    this.loadConfig();
    this.watchConfig();
    
    // Register command to create a default config
    const disposable = vscode.commands.registerCommand("extension.saveConfig", () => {
      this.saveConfig();
    });

    context.subscriptions.push(disposable);
  }

  /**
   * Retrieves the file path for the configuration file.
   *
   * @returns The full path to the configuration file or an empty string if no workspace is open.
   */
  private getConfigPath(): string {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return '';
    }
    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    return path.join(workspaceRoot, '.ai-code-config.json');
  }

  /**
   * Loads the configuration file from disk, stpres the values in the `config` property.
   * If the file is missing, fallback to default configuration values.
   * 
   * @return Config object with loaded config values
   */
  public loadConfig(): void {
    if (!this.configPath) {
      vscode.window.showWarningMessage('No workspace is open. Configuration file cannot be loaded.');
      this.config = new Config({});
      return;
    }
  
    fs.readFile(this.configPath, 'utf8', (err, data) => {
      if (err) {
        if (err.code === 'ENOENT') {
          vscode.window.showWarningMessage(`Configuration file not found at ${this.configPath}. Using default configuration.`);
          this.config = new Config({});
        } else {
          vscode.window.showErrorMessage(`Error reading configuration file: ${err.message}`);
          this.config = new Config({});
        }
        return;
      }
  
      try {
        const configData = JSON.parse(data);
        this.config = new Config(configData);
        console.log('Configuration loaded:', this.config);
      } catch (parseError: any) {
        vscode.window.showErrorMessage(`Error parsing configuration file: ${parseError.message}. Using default configuration.`);
        this.config = new Config({});
      }
    });
  }

  /**
   * Watches the configuration file for changes, creation, or deletion.
   * Reloads the config automatically when the file changes.
   */
  private watchConfig(): void {
    if (!this.configPath) {
      return;
    }
  
    this.watcher = vscode.workspace.createFileSystemWatcher(this.configPath);
  
    this.watcher.onDidChange(() => {
      vscode.window.showInformationMessage('Configuration file changed. Reloading...');
      this.loadConfig();
    });
  
    this.watcher.onDidCreate(() => {
      vscode.window.showInformationMessage('Configuration file created. Loading...');
      this.loadConfig();
    });
  
    this.watcher.onDidDelete(() => {
      vscode.window.showWarningMessage('Configuration file deleted.');
    });
  
    this.context.subscriptions.push(this.watcher);
  }

  /**
   * Creates a default configuration file if one does not exist.
   * Displays a warning if the config file already exists.
   */
  public saveConfig(): void {
    if (!this.configPath) {
      vscode.window.showWarningMessage('No workspace is open. Cannot create configuration file.');
      return;
    }
  
    fs.access(this.configPath, fs.constants.F_OK, (err) => {
      if (!err) {
        vscode.window.showWarningMessage('Configuration file already exists. Updating Config');
      }
  
      fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2), 'utf8', (writeErr) => {
        if (writeErr) {
          vscode.window.showErrorMessage(`Error creating configuration file: ${writeErr.message}`);
          return;
        }
  
        vscode.window.showInformationMessage('Config File Saves.');
        this.loadConfig();
      });
    });
  }

  /**
   * Returns the current configuration values.
  */
  public getConfig(): Config {
    return this.config;
  }



  /**
   * Disposes the file watcher when the extension is deactivated.
   */
  public dispose(): void {
    if (this.watcher) {
      this.watcher.dispose();
    }
  }
}
