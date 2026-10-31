import { ApiResponse, CommitPayload, Project, ProjectMember } from "@contextflow/shared";

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  setBaseUrl(url: string): void {
    this.baseUrl = url.replace(/\/$/, "");
  }

  /**
   * Registers a Git commit with the DevSync backend.
   */
  async registerCommit(projectId: string, commit: CommitPayload): Promise<ApiResponse<CommitPayload>> {
    try {
      const response = await fetch(`${this.baseUrl}/projects/${projectId}/commits`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repositoryKey: commit.repositoryKey,
          commitHash: commit.commitHash,
          shortHash: commit.shortHash,
          message: commit.message,
          authorName: commit.authorName,
          commitTimestamp: commit.commitTimestamp,
          linkedAt: commit.linkedAt,
          changedPaths: commit.changedPaths,
        }),
      });

      const json = (await response.json()) as ApiResponse<CommitPayload>;
      return json;
    } catch (err: any) {
      return {
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message: err.message || "Failed to connect to backend",
        },
      };
    }
  }

  /**
   * Joins a project or registers the user as a member.
   */
  async joinProject(
    projectId: string,
    data: { userId: string; userName: string; role?: string }
  ): Promise<ApiResponse<ProjectMember>> {
    try {
      const response = await fetch(`${this.baseUrl}/projects/${projectId}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const json = (await response.json()) as ApiResponse<ProjectMember>;
      return json;
    } catch (err: any) {
      return {
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message: err.message || "Failed to join project",
        },
      };
    }
  }

  /**
   * Retrieves project metadata.
   */
  async getProject(projectId: string): Promise<ApiResponse<Project>> {
    try {
      const response = await fetch(`${this.baseUrl}/projects/${projectId}`);
      const json = (await response.json()) as ApiResponse<Project>;
      return json;
    } catch (err: any) {
      return {
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message: err.message || "Failed to fetch project",
        },
      };
    }
  }
}
