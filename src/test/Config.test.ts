import * as assert from "assert";
import * as vscode from "vscode";
import { Config } from "../features/Config";

suite("Config Class Tests", () => {
  test("Default values should be applied if no user config is provided", () => {
    const config = new Config({});
    assert.strictEqual(config.enableAutoSuggestions, true);
    assert.strictEqual(config.maxTokens, 500);
    assert.strictEqual(config.temperature, 0.7);
    assert.strictEqual(config.model, "gpt-4-turbo");
  });

  test("User-provided values should override defaults", () => {
    const userConfig = {
      enableAutoSuggestions: false,
      maxTokens: 1000,
      temperature: 0.5,
      model: "gpt-3.5"
    };

    const config = new Config(userConfig);
    assert.strictEqual(config.enableAutoSuggestions, false);
    assert.strictEqual(config.maxTokens, 1000);
    assert.strictEqual(config.temperature, 0.5);
    assert.strictEqual(config.model, "gpt-3.5");
  });

  test("Should return the correct prompt for a given file type", () => {
    const config = new Config({});
    assert.strictEqual(
      config.getPrompt(".js"),
      "You are a JavaScript expert. Follow best practices and modern ES standards. Provide only code responses."
    );
  });

  test("Should return the default prompt when file type is not found", () => {
    const config = new Config({});
    assert.strictEqual(config.getPrompt(".xyz"), "You are an AI coding assistant. Provide only code responses.");
  });
});