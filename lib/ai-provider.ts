import OpenAI from 'openai'

// Model selection for OpenRouter free tier
export const PROSPECT_MODEL = 'meta-llama/llama-3.3-70b-instruct:free'
export const BUILD_MODEL = 'qwen/qwen3-coder:free'

export const OPENROUTER_BASE = 'https://openrouter.ai/api/v1'

export function getOpenRouterClient(): OpenAI {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set')
  return new OpenAI({
    apiKey,
    baseURL: OPENROUTER_BASE,
    defaultHeaders: {
      'HTTP-Referer': 'https://agent-prospector.vercel.app',
      'X-Title': 'Agent Prospector',
    },
  })
}

// Checks which provider is available, prefers OpenRouter
export function getAvailableProvider(): 'openrouter' | 'anthropic' | null {
  if (process.env.OPENROUTER_API_KEY) return 'openrouter'
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic'
  return null
}

export const PROSPECT_SYSTEM_PROMPT = `You are an Agent Prospector — an expert AI consultant who helps users discover where AI agents can automate, accelerate, or enhance their workflows.

Your job is to:
1. Ask targeted questions to understand the user's role, daily tasks, and pain points
2. Identify 2-4 concrete opportunities where AI agents would provide real value
3. For each opportunity, output a structured JSON block wrapped in <opportunity> tags

Each opportunity JSON must follow this schema exactly:
{
  "name": "string",
  "description": "string (2-3 sentences)",
  "tools": ["web-search" | "file-io" | "code-exec" | "api-calls" | "email" | "calendar" | "database" | "github"],
  "estimatedValue": "string (e.g. '2 hours/week saved')",
  "complexity": "low" | "medium" | "high"
}

Be conversational and curious. Ask 1-2 focused questions at a time. When you have enough context, present your opportunities with the JSON blocks.`

export const BUILD_SYSTEM_PROMPT = `You are an expert AI agent developer. Generate complete, production-ready TypeScript agent code based on the provided specification.

Requirements:
- Fully functional and immediately runnable
- Proper error handling with try/catch
- Use @anthropic-ai/sdk with claude-sonnet-4-6 (or the provider specified)
- Follow the specified format exactly
- No markdown fences or explanation — output ONLY the TypeScript code
- Include all necessary imports at the top`
