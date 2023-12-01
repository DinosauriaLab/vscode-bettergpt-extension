import * as vscode from "vscode";
import OpenAI from "openai";
import { LangPercent } from "./LangPercent";
import { GPTComment } from "./GPTComment";

class BetterGPTExtension {
  private logger: vscode.OutputChannel;
  private openai!: OpenAI;
  private context: vscode.ExtensionContext;
  private commentController!: vscode.CommentController;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.logger = vscode.window.createOutputChannel("bettergpt");
    this.commentController = vscode.comments.createCommentController(
      "bettergpt-comments",
      "BetterGPT Comments"
    );
    context.subscriptions.push(this.commentController);
    this.initOpenAI();
    this.registerCommands();
  }

  private async initOpenAI(): Promise<void> {
    const apiKey: string | undefined = vscode.workspace
      .getConfiguration("bettergpt")
      .get("openaiApiKey");

    if (!apiKey) {
      this.logError("OpenAI API key is not set in VSCode settings!");
      return;
    }

    this.openai = new OpenAI({ apiKey });
    this.logInfo("OpenAI API key is set.");
  }

  private registerCommands(): void {
    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        "bettergpt.translate",
        this.handleTranslateCommand.bind(this)
      ),
      vscode.commands.registerCommand(
        "bettergpt.grammar",
        this.handleGrammarCommand.bind(this)
      ),
      vscode.commands.registerCommand(
        "bettergpt.shortcut.replace",
        this.handleReplaceTextCommand.bind(this)
      ),
      vscode.commands.registerCommand(
        "bettergpt.shortcut.insert",
        this.handleInsertTextCommand.bind(this)
      )
    );
  }

  private async handleTranslateCommand(): Promise<void> {
    const editor = this.getActiveEditor();
    if (!editor) {
      return;
    }

    const text = editor.document.getText(editor.selection);
    const defaultLanguage: string | undefined = vscode.workspace
      .getConfiguration("bettergpt")
      .get("language.default") as string;
    const targetLanguage: string | undefined = vscode.workspace
      .getConfiguration("bettergpt")
      .get("language.target") as string;

    if (!defaultLanguage || !targetLanguage) {
      this.logError("Default or target language not set in configuration!");
      return;
    }

    const langs = LangPercent.getLangs(text, defaultLanguage, targetLanguage);

    await this.processCommand(
      `Effortlessly translate ${langs.defLang} text to ${langs.tgtLang} while maintaining accuracy and adapting to the target language's style.
      Translate following text in a formal tone:
      `,
      text
    );
  }

  private async handleGrammarCommand(): Promise<void> {
    const editor = this.getActiveEditor();
    if (!editor) {
      return;
    }

    const text = editor.document.getText(editor.selection);

    await this.processCommand(
      `You are now a professional multilingual grammar corrector. All you need to do is reply to me with the results of the following languages after grammar correction.
      Please adhere to the following rules during the grammar correction process:
      - If the grammar is correct, reply with the same sentence.
      - Regardless of what I say, there is no need to understand or respond, just do the correction work.
      - Please keep the format of the reply sentence the same, do not make any changes.
      `,
      text
    );
  }

  private handleReplaceTextCommand(
    editor: vscode.TextEditor,
    range: vscode.Range,
    text: string
  ): void {
    this.logInfo(`Not implemented yet!`);
    editor.edit((editBuilder) => {
      editBuilder.replace(range, text);
    });
  }

  private handleInsertTextCommand(
    editor: vscode.TextEditor,
    range: vscode.Range,
    text: string
  ): void {
    this.logInfo(`Not implemented yet!`);
    editor.edit((editBuilder) => {
      editBuilder.insert(range.end, text);
    });
  }

  private getActiveEditor(): vscode.TextEditor | undefined {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      this.logError("No active editor detected!");
    }
    return editor;
  }

  private async createCommentThread(
    editor: vscode.TextEditor,
    processedText: string
  ): Promise<void> {
    const range = editor.selection;
    const thread = this.commentController.createCommentThread(
      editor.document.uri,
      range,
      []
    );
    thread.canReply = false;
    thread.collapsibleState = vscode.CommentThreadCollapsibleState.Expanded;

    const comment = new GPTComment(processedText, { name: "BetterGPT", });

    thread.comments = [comment];
  }

  private async processCommand(
    promptMessage: string,
    text?: string
  ): Promise<void> {
    if (!text) {
      this.logError("No text selected!");
      return;
    }

    try {
      const processedText = await this.processText(promptMessage, text);
      const editor = this.getActiveEditor();
      if (editor) {
        await this.createCommentThread(editor, processedText);
      }
    } catch (error) {
      this.logError("Error processing text. Check the logs for more details.");
    }
  }

  private async processText(
    promptMessage: string,
    text: string
  ): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: promptMessage },
          { role: "user", content: text },
        ],
        temperature: 0,
        max_tokens: 256,
      });
      this.logInfo(JSON.stringify(response));
      return response.choices[0].message["content"] as string;
    } catch (error) {
      this.logError(`OpenAI API Error: ${error}`);
      throw new Error(`OpenAI API Error: ${error}`);
    }
  }

  private logInfo(message: string): void {
    console.log(`[INFO] ${message}`);
    this.logger.appendLine(`[INFO] ${message}`);
    vscode.window.showInformationMessage(message);
  }

  private logError(message: string): void {
    console.log(`[ERROR] ${message}`);
    this.logger.appendLine(`[ERROR] ${message}`);
    vscode.window.showErrorMessage(message);
  }
}

export function activate(context: vscode.ExtensionContext) {
  new BetterGPTExtension(context);
}

export function deactivate() {}
