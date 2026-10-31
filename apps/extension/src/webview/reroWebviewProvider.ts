import * as vscode from "vscode";
import * as fs from "fs";
import { DiffViewer } from "../navigation/diffViewer";
import { GitDetector } from "../git/gitDetector";
import { MessageRouter } from "./messageRouter";
import { ExtensionToWebviewMessage, ProjectEvent } from "@contextflow/shared";

export class ReroWebviewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "rero.timelineView";

  private webviewView?: vscode.WebviewView;
  private extensionUri: vscode.Uri;
  private messageRouter: MessageRouter;

  constructor(
    extensionUri: vscode.Uri,
    diffViewer: DiffViewer,
    workspaceRoot: string,
    gitDetector?: GitDetector
  ) {
    this.extensionUri = extensionUri;
    this.messageRouter = new MessageRouter(
      diffViewer,
      workspaceRoot,
      (msg) => this.postMessage(msg),
      gitDetector
    );
  }

  public setGitDetector(detector: GitDetector): void {
    this.messageRouter.setGitDetector(detector);
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this.webviewView = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        this.extensionUri,
        vscode.Uri.joinPath(this.extensionUri, "media"),
        vscode.Uri.joinPath(this.extensionUri, "media", "assets"),
      ],
    };

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (message) => {
      await this.messageRouter.handleMessage(message);
    });
  }

  /**
   * Sends a message to the Webview UI.
   */
  public postMessage(message: ExtensionToWebviewMessage): void {
    if (this.webviewView) {
      this.webviewView.webview.postMessage(message);
    }
  }

  /**
   * Broadcasts a new project or commit event to the Webview.
   */
  public broadcastEvent(event: ProjectEvent): void {
    this.postMessage({
      type: "EVENT_RECEIVED",
      payload: event,
    });
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const mediaPath = vscode.Uri.joinPath(this.extensionUri, "media");
    const indexPath = vscode.Uri.joinPath(mediaPath, "index.html").fsPath;

    let htmlContent = "";
    if (fs.existsSync(indexPath)) {
      htmlContent = fs.readFileSync(indexPath, "utf8");
    } else {
      // Fallback HTML if build hasn't run yet
      return `<!DOCTYPE html>
        <html>
          <body style="font-family: sans-serif; padding: 20px; color: #fff;">
            <h3>RERO Webview Loading...</h3>
            <p>Please run <code>npm run build</code> to compile the Webview bundle.</p>
          </body>
        </html>`;
    }

    // Convert local asset paths to webview URIs
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, "assets", "index.js"));
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, "assets", "index.css"));

    htmlContent = htmlContent.replace(/src="\/assets\/index\.js"/g, `src="${scriptUri}"`);
    htmlContent = htmlContent.replace(/href="\/assets\/index\.css"/g, `href="${styleUri}"`);

    // Inject Content Security Policy (strict script security, unsafe-eval removed)
    const csp = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https: data:; script-src ${webview.cspSource} 'unsafe-inline'; style-src ${webview.cspSource} 'unsafe-inline'; font-src ${webview.cspSource}; connect-src ${webview.cspSource} ws://localhost:* http://localhost:* https:;">`;

    htmlContent = htmlContent.replace("<head>", `<head>\n    ${csp}`);

    return htmlContent;
  }
}
