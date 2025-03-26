import * as vscode from "vscode";

export default class DocumentDecoration
{
    public static commentColor = "";
    private static lineCommentDecorationType = vscode.window.createTextEditorDecorationType({});

    private timeout: NodeJS.Timer | undefined = undefined;

    public requestUpdate(editor: vscode.TextEditor | undefined, msec: number) {

        if (this.timeout) {
            // clearTimeout(this.timeout);
            this.timeout = undefined;
        }

        this.timeout = setTimeout(this.update, msec, editor);
    }

    public update(editor: vscode.TextEditor | undefined) {
        if (!editor) {
            return;
        }

        if (DocumentDecoration.lineCommentDecorationType) {
            DocumentDecoration.lineCommentDecorationType.dispose();
        }
        DocumentDecoration.lineCommentDecorationType = vscode.window.createTextEditorDecorationType({
            color: DocumentDecoration.commentColor
        });

        const regEx = /\/\*[\s\S]*?\*\/|\/\/.*/g;
        const text = editor.document.getText();
        var commentDecorationOptions: vscode.DecorationOptions[] = [];
        let match;
        while (match = regEx.exec(text)) {
            const startPos = editor.document.positionAt(match.index);
            const endPos = editor.document.positionAt(match.index + match[0].length);
            const decoration = { range: new vscode.Range(startPos, endPos) };
            commentDecorationOptions.push(decoration);
        }

        editor.setDecorations(DocumentDecoration.lineCommentDecorationType, commentDecorationOptions);
        
        this.timeout = undefined;
    }
}