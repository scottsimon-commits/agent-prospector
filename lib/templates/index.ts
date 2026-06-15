export { webScraperTemplate } from './web-scraper'
export { codeReviewerTemplate } from './code-reviewer'
export { researchAgentTemplate } from './research-agent'
export { emailProcessorTemplate } from './email-processor'
export { dataAnalystTemplate } from './data-analyst'
export { supportBotTemplate } from './support-bot'

import { webScraperTemplate } from './web-scraper'
import { codeReviewerTemplate } from './code-reviewer'
import { researchAgentTemplate } from './research-agent'
import { emailProcessorTemplate } from './email-processor'
import { dataAnalystTemplate } from './data-analyst'
import { supportBotTemplate } from './support-bot'
import type { AgentTemplate } from '../types'

export const ALL_TEMPLATES: AgentTemplate[] = [
  webScraperTemplate,
  codeReviewerTemplate,
  researchAgentTemplate,
  emailProcessorTemplate,
  dataAnalystTemplate,
  supportBotTemplate,
]
