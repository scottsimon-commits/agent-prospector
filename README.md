# Agent Prospector

> Discover, build, and deploy AI agents — powered by Claude, deployed to Vercel.

**Live app:** [agent-prospector.vercel.app](https://agent-prospector.vercel.app)  
**GitHub:** [scottsimon-commits/agent-prospector](https://github.com/scottsimon-commits/agent-prospector)

---

## What it does

Agent Prospector is a full-stack platform that helps you:

1. **Prospect** — Conversational AI (Claude) identifies where agents can automate your workflow
2. **Build** — 3-step wizard generates complete, production-ready TypeScript agent code
3. **Gallery** — 6 ready-made templates with inline code preview and one-click deploy
4. **Deploy** — Push to GitHub and Vercel automatically using stored credentials
5. **Registry** — Manage all your agents with code view, GitHub links, and Vercel URLs

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS + shadcn/ui |
| AI | Anthropic Claude (claude-sonnet-4-6) |
| GitHub | Octokit REST API |
| Vercel | Vercel REST API + CLI |
| Validation | Zod |
| Toasts | Sonner |

---

## Quick start

### 1. Clone and install

```bash
git clone https://github.com/scottsimon-commits/agent-prospector
cd agent-prospector
npm install
```

### 2. Environment variables

Create `.env.local`:

```bash
ANTHROPIC_API_KEY=sk-ant-...     # console.anthropic.com/keys
GITHUB_TOKEN=ghp_...             # github.com/settings/tokens (needs repo scope)
VERCEL_TOKEN=vcp_...             # vercel.com/account/tokens
```

### 3. Run locally

```bash
npm run dev
# open http://localhost:3000
```

---

## Deploy your own

```bash
npx vercel --prod
```

Then add the three env vars in **Vercel → Project → Settings → Environment Variables** and redeploy.

---

## Agent templates

| Template | Trigger | Tools |
|---|---|---|
| Web Scraper | Webhook | web-search, api-calls |
| Code Reviewer | Webhook | github, api-calls |
| Research Agent | Chat | web-search, api-calls |
| Email Processor | Webhook | email, api-calls |
| Data Analyst | Chat | file-io, code-exec |
| Support Bot | Webhook | database, email |

---

## Project structure

```
app/
  page.tsx             # Dashboard + status bar
  prospect/            # Streaming discovery chat
  build/               # 3-step agent builder wizard
  gallery/             # Template browser with filter + code preview
  registry/            # Agent management table
  api/
    prospect/route.ts  # Claude SSE streaming
    build/route.ts     # Code generation (Zod validated, rate limited)
    deploy/route.ts    # GitHub repo create + Vercel deploy
    agents/route.ts    # Agent CRUD
    status/route.ts    # Env var health check
components/
  ProspectorChat       # Streaming chat with opportunity cards
  AgentBuilder         # Multi-step wizard with format selector
  CodePreview          # Syntax-highlighted viewer, copy + download
  DeployButton         # One-click deploy dialog
  StatusBar            # Env var health indicator
  SetupBanner          # Missing API key guidance
lib/
  anthropic.ts         # Anthropic client + system prompts
  github.ts            # Octokit: create repo, push files
  vercel-api.ts        # Vercel REST: create project, set env vars
  registry.ts          # In-memory agent store (swap for DB in production)
  validation.ts        # Zod schemas for all API inputs
  rate-limit.ts        # Sliding-window rate limiter
  templates/           # 6 built-in agent templates
```

---

## License

MIT
