import * as vscode from "vscode";

export interface DevSyncConfig {
  apiUrl: string;
  projectId: string;
  userId: string;
  userName: string;
}

export function getDevSyncConfig(): DevSyncConfig {
  const config = vscode.workspace.getConfiguration("devsync");
  return {
    apiUrl: config.get<string>("apiUrl", "http://localhost:3001"),
    projectId: config.get<string>("projectId", ""),
    userId: config.get<string>("userId", ""),
    userName: config.get<string>("userName", ""),
  };
}
