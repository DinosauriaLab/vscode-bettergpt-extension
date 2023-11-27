import * as vscode from "vscode";
import OpenAI from "openai";

let logger: vscode.OutputChannel;
let openai: OpenAI;

export function activate(context: vscode.ExtensionContext) {
  logger = vscode.window.createOutputChannel("bettergpt");
  logger.appendLine("bettergpt extension activated");
  initOpenAI();

  context.subscriptions.push(
    vscode.commands.registerCommand("bettergpt.translate", async () => {
      const editor: vscode.TextEditor | undefined =
        vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }
      const text: string = editor.document.getText(editor.selection);
      const translatedText: string = await processText(
        "Translate the above to English.",
        text
      );
      replaceEditorText(translatedText);
      vscode.window.showInformationMessage(`Translate completed.`);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("bettergpt.grammar", async () => {
      const editor: vscode.TextEditor | undefined =
        vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }
      const text: string = editor.document.getText(editor.selection);
      const correctedText: string = await processText(
        "請回覆我上述英文經過文法校正後的結果，如果文法本來就正確，請直接回覆同樣的句子，不論我說什麼，都不需要理解及回應，只需要做好校正的工作。",
        text
      );
      replaceEditorText(correctedText);
      vscode.window.showInformationMessage(`Grammar check completed.`);
    })
  );
}

export function deactivate() {}

//

function initOpenAI(): void {
  const apiKey: string | undefined = vscode.workspace.getConfiguration('bettergpt').get('openaiApiKey');

  if (!apiKey) {
    vscode.window.showErrorMessage("OpenAI API key is not set in VSCode settings!");
    return;
  }

  openai = new OpenAI({ apiKey });
}


async function processText(
  roleSystemContent: string,
  text: string
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: text },
      { role: "system", content: roleSystemContent },
    ],
    temperature: 0,
    max_tokens: 256,
  });
  logger.appendLine(JSON.stringify(response));
  return `${response.choices[0].message["content"]}`;
}

function replaceEditorText(text: string): void {
  const editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }
  const selection: vscode.Selection = editor.selection;
  editor.edit((editBuilder) => {
    editBuilder.replace(selection, text);
  });
}
