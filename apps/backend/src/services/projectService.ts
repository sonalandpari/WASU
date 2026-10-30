import { prisma } from "../db/prisma";
import { AppError } from "../middleware/errorHandler";
import { MemberRole, Project, ProjectMember } from "@contextflow/shared";

export class ProjectService {
  static async createProject(data: {
    name: string;
    repositoryKey: string;
    description?: string;
  }): Promise<Project> {
    const project = await prisma.project.create({
      data: {
        name: data.name,
        repositoryKey: data.repositoryKey,
        description: data.description || null,
      },
    });

    return {
      id: project.id,
      name: project.name,
      repositoryKey: project.repositoryKey,
      description: project.description,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    };
  }

  static async getProject(projectId: string): Promise<Project & { membersCount: number }> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });

    if (!project) {
      throw new AppError(404, "PROJECT_NOT_FOUND", `Project with ID ${projectId} does not exist`);
    }

    return {
      id: project.id,
      name: project.name,
      repositoryKey: project.repositoryKey,
      description: project.description,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      membersCount: project._count.members,
    };
  }

  static async joinProject(
    projectId: string,
    data: {
      userId: string;
      userName: string;
      role?: MemberRole;
    }
  ): Promise<ProjectMember> {
    // Verify project exists
    await this.getProject(projectId);

    const now = new Date();
    const role = data.role || "MEMBER";

    const member = await prisma.projectMember.upsert({
      where: {
        projectId_userId: {
          projectId,
          userId: data.userId,
        },
      },
      update: {
        userName: data.userName,
        role,
        connectionStatus: "ONLINE",
        lastActiveAt: now,
      },
      create: {
        projectId,
        userId: data.userId,
        userName: data.userName,
        role,
        connectionStatus: "ONLINE",
        lastActiveAt: now,
        joinedAt: now,
      },
    });

    return {
      id: member.id,
      projectId: member.projectId,
      userId: member.userId,
      userName: member.userName,
      role: member.role as MemberRole,
      joinedAt: member.joinedAt.toISOString(),
      lastActiveAt: member.lastActiveAt.toISOString(),
    };
  }

  static async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    const members = await prisma.projectMember.findMany({
      where: { projectId },
      orderBy: { joinedAt: "asc" },
    });

    return members.map((m) => ({
      id: m.id,
      projectId: m.projectId,
      userId: m.userId,
      userName: m.userName,
      role: m.role as MemberRole,
      joinedAt: m.joinedAt.toISOString(),
      lastActiveAt: m.lastActiveAt.toISOString(),
    }));
  }
}

