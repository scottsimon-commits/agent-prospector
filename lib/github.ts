import { Octokit } from 'octokit'

const GITHUB_TOKEN = process.env.GITHUB_TOKEN

export function getOctokit() {
  if (!GITHUB_TOKEN) throw new Error('GITHUB_TOKEN not set')
  return new Octokit({ auth: GITHUB_TOKEN })
}

export async function getAuthenticatedUser() {
  const octokit = getOctokit()
  const { data } = await octokit.rest.users.getAuthenticated()
  return data
}

export async function createRepo(name: string, description: string, isPrivate = false) {
  const octokit = getOctokit()
  const { data } = await octokit.rest.repos.createForAuthenticatedUser({
    name,
    description,
    private: isPrivate,
    auto_init: false,
  })
  return data
}

export async function pushFiles(
  owner: string,
  repo: string,
  files: { path: string; content: string }[],
  message = 'Initial commit from Agent Prospector'
) {
  const octokit = getOctokit()

  // Create blobs for each file
  const blobs = await Promise.all(
    files.map(async (file) => {
      const { data } = await octokit.rest.git.createBlob({
        owner,
        repo,
        content: Buffer.from(file.content).toString('base64'),
        encoding: 'base64',
      })
      return { sha: data.sha, path: file.path }
    })
  )

  // Create tree
  const { data: tree } = await octokit.rest.git.createTree({
    owner,
    repo,
    tree: blobs.map((b) => ({
      path: b.path,
      mode: '100644',
      type: 'blob',
      sha: b.sha,
    })),
  })

  // Create commit
  const { data: commit } = await octokit.rest.git.createCommit({
    owner,
    repo,
    message,
    tree: tree.sha,
    parents: [],
  })

  // Update HEAD
  await octokit.rest.git.createRef({
    owner,
    repo,
    ref: 'refs/heads/main',
    sha: commit.sha,
  })

  return commit
}
