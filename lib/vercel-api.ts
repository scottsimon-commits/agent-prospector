const VERCEL_TOKEN = process.env.VERCEL_TOKEN
const BASE = 'https://api.vercel.com'

function headers() {
  if (!VERCEL_TOKEN) throw new Error('VERCEL_TOKEN not set')
  return {
    Authorization: `Bearer ${VERCEL_TOKEN}`,
    'Content-Type': 'application/json',
  }
}

export async function createProject(name: string, githubOwner: string, githubRepo: string) {
  const res = await fetch(`${BASE}/v10/projects`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      name,
      framework: 'nextjs',
      gitRepository: {
        type: 'github',
        repo: `${githubOwner}/${githubRepo}`,
      },
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Vercel createProject failed: ${err}`)
  }
  return res.json()
}

export async function setEnvVars(
  projectId: string,
  vars: { key: string; value: string; target: string[] }[]
) {
  const res = await fetch(`${BASE}/v10/projects/${projectId}/env`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(vars.map((v) => ({ ...v, type: 'plain' }))),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Vercel setEnvVars failed: ${err}`)
  }
  return res.json()
}

export async function getDeployments(projectId: string) {
  const res = await fetch(`${BASE}/v6/deployments?projectId=${projectId}&limit=1`, {
    headers: headers(),
  })
  if (!res.ok) return null
  return res.json()
}

export async function triggerDeploy(projectId: string, gitRef = 'main') {
  const res = await fetch(`${BASE}/v13/deployments`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ name: projectId, gitSource: { type: 'github', ref: gitRef } }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Vercel deploy failed: ${err}`)
  }
  return res.json()
}
