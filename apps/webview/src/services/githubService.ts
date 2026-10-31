import { ProjectEvent, UserPresence, ArchitectureGraph } from '@contextflow/shared';

export interface ImportedRepoData {
  projectName: string;
  repositoryName: string;
  currentBranch: string;
  roomCode: string;
  description: string;
  stars: number;
  events: ProjectEvent[];
  presence: UserPresence[];
  graph: any;
}

export function parseRepoInput(input: string): { owner: string; repo: string } | null {
  const clean = input.trim().replace(/\/$/, '');
  
  // Full URL: https://github.com/owner/repo or git@github.com:owner/repo.git
  const urlMatch = clean.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
  if (urlMatch) {
    return { owner: urlMatch[1], repo: urlMatch[2] };
  }

  // Shorthand: owner/repo
  const parts = clean.split('/');
  if (parts.length === 2 && parts[0] && parts[1]) {
    return { owner: parts[0], repo: parts[1] };
  }

  return null;
}

export async function fetchPublicRepo(owner: string, repo: string): Promise<ImportedRepoData> {
  const headers: HeadersInit = {
    Accept: 'application/vnd.github.v3+json',
  };

  // 1. Fetch Repository Details
  const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
  if (!repoRes.ok) {
    if (repoRes.status === 404) {
      throw new Error(`Public repository "${owner}/${repo}" was not found.`);
    }
    if (repoRes.status === 403) {
      throw new Error(`GitHub API rate limit exceeded. Please try again shortly or use another repo.`);
    }
    throw new Error(`GitHub API returned status ${repoRes.status}`);
  }
  const repoMeta = await repoRes.json();

  // 2. Fetch Recent Commits (Parallel)
  const [commitsRes, contribRes, contentsRes] = await Promise.allSettled([
    fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=20`, { headers }),
    fetch(`https://api.github.com/repos/${owner}/${repo}/contributors?per_page=8`, { headers }),
    fetch(`https://api.github.com/repos/${owner}/${repo}/contents`, { headers }),
  ]);

  // Parse commits
  let events: ProjectEvent[] = [];
  if (commitsRes.status === 'fulfilled' && commitsRes.value.ok) {
    const rawCommits = await commitsRes.value.json();
    events = (rawCommits || []).map((c: any, index: number) => {
      const commitDate = c.commit?.author?.date ? new Date(c.commit.author.date) : new Date();
      const authorName = c.commit?.author?.name || c.author?.login || 'Contributor';
      const avatarUrl = c.author?.avatar_url || '';

      return {
        id: `gh-${c.sha || index}`,
        projectId: repoMeta.name || repo,
        type: 'COMMIT_CREATED' as any,
        userId: c.author?.login || `user-${index}`,
        userName: authorName,
        userAvatar: avatarUrl || authorName.charAt(0).toUpperCase(),
        timestamp: commitDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        description: c.commit?.message?.split('\n')[0] || 'Commit update',
        metadata: {
          commitHash: c.sha || 'HEAD',
          branch: repoMeta.default_branch || 'main',
          diffSummary: { added: Math.floor(Math.random() * 25) + 5, deleted: Math.floor(Math.random() * 8) },
          file: c.commit?.message?.includes('/') ? c.commit.message.split(' ').find((w: string) => w.includes('/')) : undefined,
        },
      };
    });
  }

  // Parse contributors into Presence
  let presence: UserPresence[] = [];
  if (contribRes.status === 'fulfilled' && contribRes.value.ok) {
    const rawContribs = await contribRes.value.json();
    presence = (rawContribs || []).map((u: any, idx: number) => ({
      id: u.login || `contrib-${idx}`,
      name: u.login || `Developer ${idx + 1}`,
      avatar: u.avatar_url || (u.login || 'D').charAt(0).toUpperCase(),
      online: idx < 3, // mark top 3 online
      activeFile: idx === 0 ? 'src/index.ts' : idx === 1 ? 'README.md' : 'package.json',
      lastActive: idx < 3 ? 'Active now' : 'Earlier today',
    }));
  }

  // Parse files into dynamic Architecture Graph
  let nodes: any[] = [];
  let edges: any[] = [];
  if (contentsRes.status === 'fulfilled' && contentsRes.value.ok) {
    const rawContents = await contentsRes.value.json();
    if (Array.isArray(rawContents)) {
      const files = rawContents.slice(0, 8);
      nodes = files.map((f: any, idx: number) => ({
        id: `node-${f.name}`,
        type: 'custom',
        position: { x: 120 + (idx % 3) * 220, y: 60 + Math.floor(idx / 3) * 130 },
        data: {
          label: f.name,
          path: f.path || f.name,
          module: f.type === 'dir' ? 'Directory Module' : 'Core Source',
          type: f.type === 'dir' ? 'module' : 'component',
          size: f.size || 1024,
          imports: idx > 0 ? [files[0]?.name] : [],
          exports: [f.name.split('.')[0] || f.name],
          modified: idx === 0,
        },
      }));

      // Generate visual edges connecting to first node
      for (let i = 1; i < nodes.length; i++) {
        edges.push({
          id: `e-${nodes[0].id}-${nodes[i].id}`,
          source: nodes[0].id,
          target: nodes[i].id,
          animated: i === 1,
        });
      }
    }
  }

  // Default graph fallback if repository is empty
  const graph = nodes.length > 0 ? {
    nodes,
    edges,
    summary: {
      totalModules: nodes.length,
      crossModuleImports: edges.length,
      isolatedModules: Math.max(0, nodes.length - edges.length),
      circularDependencies: 0,
      lastUpdated: 'Just now from GitHub',
    },
  } : null;

  return {
    projectName: repoMeta.name,
    repositoryName: repoMeta.full_name,
    currentBranch: repoMeta.default_branch || 'main',
    roomCode: repoMeta.name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || 'PUBLIC',
    description: repoMeta.description || 'Public GitHub Repository',
    stars: repoMeta.stargazers_count || 0,
    events,
    presence,
    graph,
  };
}
