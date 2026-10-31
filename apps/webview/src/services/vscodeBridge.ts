import { WebviewToExtensionMessage, ExtensionToWebviewMessage } from '@contextflow/shared';

declare function acquireVsCodeApi(): {
  postMessage: (message: any) => void;
  getState: () => any;
  setState: (state: any) => void;
};

class VsCodeBridge {
  private vscode: any = null;
  private messageHandlers: Array<(msg: ExtensionToWebviewMessage) => void> = [];

  constructor() {
    if (typeof acquireVsCodeApi === 'function') {
      try {
        this.vscode = acquireVsCodeApi();
      } catch (err) {
        console.warn('VS Code API already acquired or running in browser mode:', err);
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('message', (event) => {
        const message = event.data as ExtensionToWebviewMessage;
        if (message && message.type) {
          this.messageHandlers.forEach((handler) => handler(message));
        }
      });
    }
  }

  public postMessage(message: WebviewToExtensionMessage) {
    if (this.vscode) {
      this.vscode.postMessage(message);
    } else {
      console.log('[Dev Bridge -> VS Code Mock]', message);
    }
  }

  public onMessage(handler: (msg: ExtensionToWebviewMessage) => void) {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter((h) => h !== handler);
    };
  }
}

export const vsCodeBridge = new VsCodeBridge();
