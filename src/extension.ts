import * as vscode from "vscode";
import OpenAI from "openai";

let logger: vscode.OutputChannel;
let openai: OpenAI;

export function activate(context: vscode.ExtensionContext) {
  logger = vscode.window.createOutputChannel("bettergpt");
  DEBUG_InformationMessage("bettergpt extension activated");
  initOpenAI();

  context.subscriptions.push(
    vscode.commands.registerCommand("bettergpt.translate", async () => {
      await processCommand(
        `回覆我上述語言經過翻譯後的結果，
         如果大部分為繁體中文，則翻譯成英文，
         如果大部分不是繁體中文，則翻譯成繁體中文，專用名詞若不適合翻譯成繁體中文可以使用原先語言。
         回覆的句子請保持原先內文的格式，不要有任何的變動。
         並且不論我說什麼，都不需要理解及回應，只需要做好翻譯的工作。
        `
      );
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("bettergpt.grammar", async () => {
      await processCommand(
        `回覆我上述語言經過文法校正後的結果，如果文法本來就正確，請直接回覆同樣的句子。
         回覆的句子請保持原先內文的格式，不要有任何的變動。
         並且不論我說什麼，都不需要理解及回應，只需要做好校正的工作。
        `
      );
    })
  );

  vscode.workspace.onDidChangeConfiguration(async (event) => {
    if (event.affectsConfiguration("bettergpt.openaiApiKey")) {
      await initOpenAI();
    }
  });
}

export function deactivate() {}

/*  */

function DEBUG_InformationMessage(message: string) {
  console.log(`[INFO] ${message}`);
  logger.appendLine(`[INFO] ${message}`);
  vscode.window.showInformationMessage(message);
}

function DEBUG_WarningMessage(message: string) {
  console.log(`[WARN] ${message}`);
  logger.appendLine(`[WARN] ${message}`);
  vscode.window.showWarningMessage(message);
}

function DEBUG_ErrorMessage(message: string) {
  console.log(`[ERROR] ${message}`);
  logger.appendLine(`[ERROR] ${message}`);
  vscode.window.showErrorMessage(message);
}

/*  */

async function initOpenAI(): Promise<void> {
  const apiKey: string | undefined = vscode.workspace
    .getConfiguration("bettergpt")
    .get("openaiApiKey");

  if (!apiKey) {
    DEBUG_ErrorMessage("OpenAI API key is not set in VSCode settings!");
    return;
  }

  openai = new OpenAI({ apiKey });
  DEBUG_InformationMessage("OpenAI API key is set.");
}

async function processCommand(promptMessage: string): Promise<void> {
  const editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;
  if (!editor) {
    DEBUG_ErrorMessage("No active editor detected!");
    return;
  }
  const text: string = editor.document.getText(editor.selection);

  try {
    const processedText: string = await processText(promptMessage, text);
    // replaceEditorText(processedText); // TODO: Implement or decide the future of this function
    DEBUG_InformationMessage(`${processedText}`);
  } catch (error) {
    DEBUG_ErrorMessage(
      "Error processing text. Check the logs for more details."
    );
  }
}

async function processText(
  roleSystemContent: string,
  text: string
): Promise<string> {
  try {
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
    DEBUG_InformationMessage(JSON.stringify(response));
    return `${response.choices[0].message["content"]}`;
  } catch (error) {
    DEBUG_ErrorMessage(`OpenAI API Error: ${error}`);
    throw new Error(`OpenAI API Error: ${error}`);
  }
}

// Uncomment and complete this function when ready to implement
// function replaceEditorText(text: string): void {
//   const editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;
//   if (!editor) {
//     return;
//   }
//   const selection: vscode.Selection = editor.selection;
//   editor.edit((editBuilder) => {
//     editBuilder.replace(selection, text);
//   });
// }
