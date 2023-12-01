import * as vscode from 'vscode';

export class GPTComment implements vscode.Comment {
    id: number;
    label: string | undefined;
    savedBody: string | vscode.MarkdownString; // 用於取消操作時恢復原始內容
    contextValue: string | undefined; // 可用於定義註釋的額外屬性

    constructor(
        public body: string | vscode.MarkdownString,
        public author: vscode.CommentAuthorInformation,
        public parent?: vscode.CommentThread,
        public mode: vscode.CommentMode = vscode.CommentMode.Preview,
        contextValue?: string
    ) {
        this.id = Math.floor(Math.random() * 1000000); // 隨機生成一個 ID
        this.savedBody = body;
        this.contextValue = contextValue;
    }
}
