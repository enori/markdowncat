import * as vscode from "vscode";
import * as path from "path";
import { writeFile, appendFile, readFile, appendFileSync, readFileSync, writeFileSync, fstatSync } from 'fs';
import { DocIterator } from "./DocIterator";
import { DocBufferTextDocument, DocBufferBinary } from "./DocBuffer";
import { space_p, eol_p, line_comment_p, block_comment_p, line_any_p } from "./parser/common_p";
import { include_p } from "./parser/include_p";
import { extractExtentision } from "./mdcatUtility";


export class ExpandMdcat
{
    doc: vscode.TextDocument
    docDir: string
    outputFilePath: string
    eol : string

    constructor(doc: vscode.TextDocument)
    {
        this.doc = doc;
        this.outputFilePath = this.getOutputFilePath(doc.fileName);
        this.docDir = path.dirname(this.outputFilePath);
        this.eol = (this.doc.eol == vscode.EndOfLine.CRLF) ? "\r\n" : "\n";
    }

    getOutputFilePath(mdcatPath: string)
    {
        var s = ""
        s += path.dirname(mdcatPath)
        s += path.sep
        s += path.basename(mdcatPath, path.extname(mdcatPath))
        s += '.md'
        return s
    }

    run()
    {
        writeFileSync(this.outputFilePath, "")
        
        var it = new DocIterator(new DocBufferTextDocument(this.doc))

        while (!it.isEnd())
        {
            // スペース, 改行
            while (space_p(it) || eol_p(it))
            {
                this.onOutputMatched(it);
            }

            if (it.isEOL)
            {
                it.readLine();
                continue;
            }

            // コメント
            if (line_comment_p(it) || block_comment_p(it))
            {
                this.onDiscardMatched(it)
                continue;
            }

            // インクルードファイルを展開
            if (include_p(it, filepath => this.onInclude(filepath)))
            {
                this.onDiscardMatched(it)
                continue;
            }
            
            // そのままコピー
            if  (line_any_p(it))
            {
                this.onOutputMatched(it);
                continue;
            }
        }
    }


    onOutputMatched(it: DocIterator): void
    {
        let str = it.getMatched();
        if (str.length > 0)
        {
            appendFileSync(this.outputFilePath, str)
        }
        it.discardMatched();
    }

    onDiscardMatched(it: DocIterator): void
    {
        it.discardMatched();
    }

    onInclude(filepath: string): void
    {
        let data = readFileSync(this.docDir + path.sep + filepath)
		let ext = extractExtentision(filepath);

        appendFileSync(this.outputFilePath, "<!-- " + filepath + " -->" + this.eol)

        switch (ext)
        {
        case "css": this.onIncludeCSS(data); break;
        case "md":  this.onIncludeMD(data); break;
        default:    appendFileSync(this.outputFilePath, data); break;
        }
    }

    onIncludeCSS(data: Buffer): void
    {
	    appendFileSync(this.outputFilePath, "<style>" + this.eol)	
		appendFileSync(this.outputFilePath, data)
		appendFileSync(this.outputFilePath, "</style>" + this.eol)
    }

    onIncludeMD(data: Buffer): void
    {
        var it = new DocIterator(new DocBufferBinary(data));

        while (!it.isEnd())
        {
            // スペース, 改行
            while (space_p(it) || eol_p(it))
            {
                this.onOutputMatched(it);
            }

            if (it.isEOL)
            {
                it.readLine();
                continue;
            }

            // コメント
            if (line_comment_p(it) || block_comment_p(it))
            {
                this.onDiscardMatched(it)
                continue;
            }

            // インクルードファイルを展開
            if (include_p(it, filepath => this.onInclude(filepath)))
            {
                this.onDiscardMatched(it)
                continue;
            }
            
            // そのままコピー
            if  (line_any_p(it))
            {
                this.onOutputMatched(it);
                continue;
            }
        }

        

		//appendFileSync(this.outputFilePath, data)
    }
}