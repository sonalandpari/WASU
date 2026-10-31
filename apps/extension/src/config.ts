import * as vscode from "vscode";

export interface ReroConfig {
  apiUrl: string;
  projectId: string;
  userId: string;
  userName: string;
}

export function getReroConfig(): ReroConfig {
  const config = vscode.workspace.getConfiguration("rero");
  return {
    apiUrl: config.get<string>("apiUrl", "http://localhost:3001"),
    projectId: config.get<string>("projectId", ""),
    userId: config.get<string>("userId", ""),
    userName: config.get<string>("userName", ""),
  };
}
