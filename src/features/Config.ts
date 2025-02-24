import * as fs from 'fs';
import * as path from 'path';

export class Config {
  /** AI system prompts mapped to file extensions */
  public fileTypePrompts: Record<string, string>;

  /** Enables or disables automatic AI suggestions */
  public enableAutoSuggestions: boolean;

  /** The maximum token count for AI responses */
  public maxTokens: number;

  /** Controls randomness in AI responses (higher = more creative) */
  public temperature: number;

  /** The AI model used for responses */
  public model: string;


  /** Default configuration settings */
  private static defaultConfig: Config = new Config({
    fileTypePrompts: {
      '.*': 'You are an AI coding assistant. Provide only code responses.',
    },
    enableAutoSuggestions: true,
    maxTokens: 500,
    temperature: 0.7,
    model: 'gpt-4-turbo',
  });

  /**
   * Constructs a Config instance, merging user settings with defaults.
   *
   * @param userConfig - Partial configuration settings provided by the user.
   */
  constructor(userConfig: Partial<Config>) {
    this.fileTypePrompts =
      userConfig.fileTypePrompts ?? Config.defaultConfig.fileTypePrompts;
    this.enableAutoSuggestions =
      userConfig.enableAutoSuggestions ??
      Config.defaultConfig.enableAutoSuggestions;
    this.maxTokens = userConfig.maxTokens ?? Config.defaultConfig.maxTokens;
    this.temperature =
      userConfig.temperature ?? Config.defaultConfig.temperature;
    this.model = userConfig.model ?? Config.defaultConfig.model;
  }

  /**
   * Retrieves the AI system prompt based on a file's extension.
   *
   * @param fileExtension - The file extension (e.g., ".js", ".py").
   * @returns The AI system prompt for the specified file type.
   */
  public getPrompt(fileExtension: string): string {
    return this.fileTypePrompts[fileExtension] || this.fileTypePrompts['.*'];
  }

}

