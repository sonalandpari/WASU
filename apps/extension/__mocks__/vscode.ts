export class Uri {
  public scheme: string;
  public authority: string;
  public path: string;
  public query: string;
  public fragment: string;

  constructor(scheme: string, authority: string, path: string, query: string, fragment: string) {
    this.scheme = scheme;
    this.authority = authority;
    this.path = path;
    this.query = query;
    this.fragment = fragment;
  }

  get fsPath(): string {
    return this.path;
  }

  static file(path: string): Uri {
    return new Uri("file", "", path, "", "");
  }

  static parse(value: string): Uri {
    try {
      const u = new URL(value);
      return new Uri(u.protocol.replace(":", ""), u.host, u.pathname, u.search.replace(/^\?/, ""), u.hash);
    } catch {
      return new Uri("rero-git", "", value, "", "");
    }
  }

  static joinPath(base: Uri, ...pathSegments: string[]): Uri {
    const joined = [base.path, ...pathSegments].join("/").replace(/\/+/g, "/");
    return new Uri(base.scheme, base.authority, joined, base.query, base.fragment);
  }

  static from(components: { scheme: string; authority?: string; path: string; query?: string; fragment?: string }): Uri {
    return new Uri(
      components.scheme,
      components.authority || "",
      components.path,
      components.query || "",
      components.fragment || ""
    );
  }
}

export const window = {
  showInformationMessage: jest.fn(),
  showWarningMessage: jest.fn(),
  showErrorMessage: jest.fn(),
  showQuickPick: jest.fn(),
  showInputBox: jest.fn(),
  registerWebviewViewProvider: jest.fn(() => ({ dispose: jest.fn() })),
  createStatusBarItem: jest.fn(() => ({
    show: jest.fn(),
    dispose: jest.fn(),
  })),
};

export const commands = {
  executeCommand: jest.fn(),
  registerCommand: jest.fn(() => ({ dispose: jest.fn() })),
};

export const workspace = {
  workspaceFolders: [],
  registerTextDocumentContentProvider: jest.fn(() => ({ dispose: jest.fn() })),
  onDidSaveTextDocument: jest.fn(() => ({ dispose: jest.fn() })),
  openTextDocument: jest.fn(),
  getConfiguration: jest.fn(() => ({
    get: jest.fn((key, def) => def),
  })),
};

export const extensions = {
  getExtension: jest.fn(),
};

export const StatusBarAlignment = {
  Left: 1,
  Right: 2,
};
