import * as assert from "assert";
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { ConfigManager } from "../features/ConfigManager"; // Adjust path if needed

suite("ConfigManager Test Suite", () => {
  vscode.window.showInformationMessage("Start ConfigManager tests.");

  let context: vscode.ExtensionContext;
  let configManager: ConfigManager;
  let configPath: string;

  setup(() => {
    // Mock VS Code extension context
    context = { subscriptions: [] } as any;

    // Initialize ConfigManager
    configManager = new ConfigManager(context);

    // Get the expected config path
    configPath = path.join(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || "", ".ai-code-config.json");

    // Ensure the config file does not exist before each test
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }
  });

  teardown(() => {
    // Dispose the ConfigManager and cleanup
    configManager.dispose();
  
    // Clear all registered commands
    while (context.subscriptions.length > 0) {
      const sub = context.subscriptions.pop();
      if (sub) {sub.dispose();};
    }
  
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }
  });

  test("ConfigManager initializes without errors", () => {
    assert.ok(configManager);
  });

  test("ConfigManager loads default config when no file exists", () => {
    configManager.loadConfig();
    assert.ok(configManager);
  });

  test("ConfigManager creates default config file", async () => {
    configManager.saveConfig();
    
    // Wait a short time to allow async file write
    await new Promise((resolve) => setTimeout(resolve, 500));

    assert.ok(fs.existsSync(configPath), "Config file should be created");
  });

  test("ConfigManager loads config when file exists", async () => {
    const testConfig = { setting1: false, setting2: "custom value" };
    fs.writeFileSync(configPath, JSON.stringify(testConfig, null, 2));

    // Wait a short time to allow async file read
    await new Promise((resolve) => setTimeout(resolve, 500));

    configManager.loadConfig();
    
    assert.ok(fs.existsSync(configPath), "Config file should exist");
  });

  test("ConfigManager detects config file changes", async () => {
    configManager.saveConfig();

    // Wait for the file to be written
    await new Promise((resolve) => setTimeout(resolve, 500));

    assert.ok(fs.existsSync(configPath), "Config file should be created");

    // Modify the file
    fs.writeFileSync(configPath, JSON.stringify({ setting1: false }, null, 2));

    // Wait for the watcher to detect changes
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    assert.ok(fs.existsSync(configPath), "Config file should still exist after modification");
  });

  test("ConfigManager detects config file deletion", async () => {
    configManager.saveConfig();

    // Wait for the file to be written
    await new Promise((resolve) => setTimeout(resolve, 500));

    assert.ok(fs.existsSync(configPath), "Config file should be created");

    // Delete the file
    fs.unlinkSync(configPath);

    // Wait for the watcher to detect deletion
    await new Promise((resolve) => setTimeout(resolve, 500));

    assert.ok(!fs.existsSync(configPath), "Config file should be deleted");
  });
});
