import { NextRequest } from 'next/server'
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType, VerticalAlign,
  LevelFormat, ExternalHyperlink,
} from 'docx'
import { getGroqClient, GROQ_MODEL, GROQ_FALLBACK_MODEL } from '@/lib/ai-provider'
import type { BusinessProspectResult } from '@/lib/types'

const NAVY = '1F3864', BLUE = '2E75B6', TEAL = '17A589', GOLD = 'D4AC0D'
const LGRAY = 'F2F4F7', MGRAY = 'BDC3C7', DGRAY = '555555', WHITE = 'FFFFFF', FTNOTE = '444444'
const CW = 9720

const nb = () => ({ style: BorderStyle.NONE, size: 0, color: WHITE })
const sb = (c: string) => ({ style: BorderStyle.SINGLE, size: 1, color: c })
const aNB = () => ({ top: nb(), bottom: nb(), left: nb(), right: nb() })
const aB = (c: string) => ({ top: sb(c), bottom: sb(c), left: sb(c), right: sb(c) })

function rule(color = BLUE, before = 160, after = 160) {
  return new Paragraph({ spacing: { before, after }, border: { bottom: { style: BorderStyle.SINGLE, size: 8, color, space: 1 } }, children: [] })
}

function spacer(pts = 120) {
  return new Paragraph({ spacing: { before: 0, after: pts }, children: [] })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function para(runs: TextRun | TextRun[], opts: { align?: any; before?: number; after?: number } = {}) {
  return new Paragraph({
    alignment: opts.align ?? AlignmentType.LEFT,
    spacing: { before: opts.before ?? 0, after: opts.after ?? 140 },
    children: Array.isArray(runs) ? runs : [runs],
  })
}

function txt(text: string, opts: { size?: number; bold?: boolean; italic?: boolean; color?: string; caps?: boolean } = {}) {
  return new TextRun({
    text,
    font: 'Arial',
    size: opts.size ?? 22,
    bold: opts.bold ?? false,
    italics: opts.italic ?? false,
    color: opts.color ?? DGRAY,
    allCaps: opts.caps ?? false,
  })
}

function sectionHeader(label: string, color = BLUE) {
  return new Paragraph({
    spacing: { before: 320, after: 100 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color, space: 2 } },
    children: [new TextRun({ text: label, font: 'Arial', size: 24, bold: true, color, allCaps: true })],
  })
}

const CM = { top: 120, bottom: 120, left: 160, right: 160 }

function fmt(n: number): string {
  return '$' + n.toLocaleString('en-US')
}

function parseEmployeeCount(sizeStr: string): number {
  const match = sizeStr.match(/(\d+)\s*[-–]\s*(\d+)/)
  if (match) return Math.round((parseInt(match[1]) + parseInt(match[2])) / 2)
  const single = sizeStr.match(/(\d+)/)
  return single ? parseInt(single[1]) : 100
}

function stripJsonFences(text: string): string {
  return text.replace(/^```(?:json)?\s*\n?/m, '').replace(/\n?```\s*$/m, '').trim()
}

interface AgentValue {
  name: string
  conservative: number
  fullPotential: number
}

interface MIAIntel {
  knowledgeWorkerPercent: number
  knowledgeWorkerRationale: string
  fullyLoadedWageUSD: number
  wageRationale: string
  whyMindOpening: string
  institutionalKnowledgeRisk: string
  specificImpactAreas: { title: string; body: string }[]
  agentAmplifierNote: string
  competitiveUrgencyNote: string
  agentValues: AgentValue[]
}

const MIND_AGENTS = [
  {
    name: 'Knowledge Capture Agent',
    category: 'Knowledge Infrastructure',
    description: 'Continuously extracts and indexes institutional knowledge from meetings, conversations, documents, and expert sessions into the MIND knowledge graph — automatically. Every decision, process, and best practice is captured and becomes instantly searchable by anyone on your team.',
    impact: 'Protects against knowledge loss valued at $100K–$500K per key departure | 10–15 hrs saved per knowledge capture event',
  },
  {
    name: 'Cross-System Intelligence Agent',
    category: 'Enterprise Integration',
    description: 'Bridges your ERP, CRM, email platform, production systems, and document libraries into a single intelligent query layer powered by MIND. Any employee can ask a natural language question and receive an accurate, sourced answer from across all systems — in under 2 seconds.',
    impact: 'Eliminates 500–800 hrs/year in cross-departmental information hunting | Reduces decisions from days to minutes',
  },
  {
    name: 'Onboarding Intelligence Agent',
    category: 'Human Capital',
    description: 'Delivers personalized, conversational access to your organization\'s complete institutional memory for new hires. Instead of months of shadowing and slow discovery, new employees reach full productivity in approximately 2.5 months — a 58% reduction powered by MIND\'s knowledge graph.',
    impact: '$25,000–$50,000 per hire in accelerated productivity | Immediate ROI on every new team member',
  },
]

export async function POST(req: NextRequest) {
  let body: unknown
  try { body = await req.json() } catch { return new Response('Invalid JSON', { status: 400 }) }

  const { companyName, location, result } = body as {
    companyName: string
    location: string
    result: BusinessProspectResult
  }

  if (!companyName || !result?.company) {
    return new Response('Missing required fields', { status: 400 })
  }

  const { company, recommendations } = result
  const shortName = company.name || companyName
  const aiaAgents = recommendations.slice(0, 7)

  // ── GROQ: Generate MIA intelligence ────────────────────────────────────────
  const systemPrompt = `You are an Astra AI enterprise knowledge platform consultant generating content for a MIND Impact Assessment document.

MIND is a Knowledge Graph RAG platform that captures 100% of an organization's institutional knowledge. Key facts:
- 90%+ accuracy on complex queries (vs 50-70% for traditional AI)
- 98-100% accuracy on structured queries
- ~50% reduction in AI hallucinations
- Sub-2-second response times
- 400+ pre-built integrations (ERP, CRM, email, documents)
- Deploys in 2-4 weeks

Given the company profile, generate targeted intelligence for their MIA. Be SPECIFIC to this company and industry.

Return ONLY valid JSON, no explanation, no code fences:
{
  "knowledgeWorkerPercent": number (10-90; RESEARCH this company's actual workforce mix carefully — default to 30% for standard manufacturing/production unless you find specific evidence of significant engineering teams, R&D operations, complex B2B technical sales requiring research, or extensive professional staff; use 40-50% only if company profile clearly indicates knowledge-intensive operations like electronics distribution, technical services, or engineering-heavy manufacturing; finance/banking/professional services 70%+; for manufacturing companies err conservative — 30% is the baseline unless research justifies higher),
  "knowledgeWorkerRationale": "1 sentence — why this % fits this specific company",
  "fullyLoadedWageUSD": number (annual fully-loaded cost including benefits/overhead, specific to industry AND geography — SD/Midwest wages are lower than coastal),
  "wageRationale": "short phrase only — format: 'Regional benchmark for [specific industry type] knowledge workers (fully-loaded) relative to [region/area]' — no additional explanation",
  "whyMindOpening": "2-3 sentences addressing something specific about this company that sets up why MIND matters. Reference something real about their operations.",
  "institutionalKnowledgeRisk": "2-3 sentences — the concrete knowledge risk this company faces. What specifically walks out the door when someone leaves?",
  "specificImpactAreas": [
    { "title": "4-6 word label", "body": "2-3 sentences specific to this company — NOT generic" },
    { "title": "...", "body": "..." },
    { "title": "...", "body": "..." }
  ],
  "agentAmplifierNote": "2-3 sentences on how MIND specifically amplifies the AI agents already recommended for this company",
  "competitiveUrgencyNote": "2-3 sentences of competitive urgency specific to their industry",
  "agentValues": [
    { "name": "exact agent name from the list below", "conservative": number, "fullPotential": number },
    ... one entry per agent (all 10 total)
  ]
}

For agentValues: include ALL 10 agents — the 7 AIA agents listed below plus these 3 MIND infrastructure agents:
- Knowledge Capture Agent: captures institutional knowledge continuously into MIND graph
- Cross-System Intelligence Agent: bridges ERP/CRM/email into unified query layer
- Onboarding Intelligence Agent: accelerates new hire ramp from 6mo to 2.5mo via institutional memory
Conservative = minimum realistic annual value with basic adoption. Full Potential = annual value with strong adoption and integration. Values in USD. Be specific to this company's size, industry, and geography.`

  const userMessage = `Company: ${shortName}
Industry: ${company.industry}
Business Type: ${company.businessType}
Estimated Size: ${company.estimatedSize}
Location: ${location}
Primary Operations: ${company.primaryOperations.join(', ')}
Key Pain Points: ${company.keyPainPoints.join(', ')}
Technology Profile: ${company.technologyProfile}

AI Agents already recommended for this company (7 AIA agents):
${aiaAgents.map(r => `- ${r.name} (${r.category}): ${r.description}`).join('\n')}

Plus 3 MIND infrastructure agents (always included):
- Knowledge Capture Agent (Knowledge Infrastructure): Continuously extracts and indexes institutional knowledge from meetings, conversations, documents, and expert sessions into the MIND knowledge graph.
- Cross-System Intelligence Agent (Enterprise Integration): Bridges ERP, CRM, email platform, production systems, and document libraries into a single intelligent query layer powered by MIND.
- Onboarding Intelligence Agent (Human Capital): Delivers personalized, conversational access to the organization's complete institutional memory for new hires — reducing ramp time from ~6 months to ~2.5 months.`

  let intel: MIAIntel
  try {
    const groq = getGroqClient()
    let response
    try {
      response = await groq.chat.completions.create({
        model: GROQ_MODEL,
        stream: false,
        max_tokens: 2200,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      if (msg.includes('429') || msg.includes('rate')) {
        response = await groq.chat.completions.create({
          model: GROQ_FALLBACK_MODEL,
          stream: false,
          max_tokens: 2200,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
        })
      } else throw e
    }
    intel = JSON.parse(stripJsonFences(response.choices[0]?.message?.content ?? ''))
  } catch {
    intel = {
      knowledgeWorkerPercent: 30,
      knowledgeWorkerRationale: 'Estimated based on industry norms for this business type.',
      fullyLoadedWageUSD: 75000,
      wageRationale: 'Regional benchmark for this industry and geography.',
      whyMindOpening: `${shortName} has built deep operational expertise over the years — expertise that lives in the minds of your team members and across the files, emails, and systems they work with every day.`,
      institutionalKnowledgeRisk: 'When experienced employees depart, they take critical institutional knowledge with them — knowledge that took years to accumulate and can cost hundreds of thousands of dollars to rebuild. Every month without a knowledge graph is a month that risk compounds.',
      specificImpactAreas: [
        { title: 'Knowledge Retention & Protection', body: 'MIND captures and preserves institutional knowledge across your entire organization, ensuring critical process expertise is never lost when team members transition.' },
        { title: 'Operational Intelligence', body: 'Your team currently spends significant time searching for information across multiple systems. MIND unifies this knowledge into a single, instantly searchable layer available to everyone.' },
        { title: 'Decision Speed & Accuracy', body: 'Complex decisions that currently require days of research and cross-departmental coordination can be made in minutes when the right information is always at your fingertips.' },
      ],
      agentAmplifierNote: 'The AI agents recommended for your business will perform significantly better when powered by MIND\'s knowledge graph — because they\'ll have access to your complete institutional context rather than operating in isolation with no memory of your business.',
      competitiveUrgencyNote: 'Organizations in your industry are beginning to deploy knowledge graph infrastructure. The companies that move first will have a compounding intelligence advantage that late adopters simply cannot overcome by throwing money at the problem later.',
      agentValues: [
        ...aiaAgents.map(a => ({ name: a.name, conservative: 15000, fullPotential: 35000 })),
        { name: 'Knowledge Capture Agent', conservative: 20000, fullPotential: 50000 },
        { name: 'Cross-System Intelligence Agent', conservative: 18000, fullPotential: 45000 },
        { name: 'Onboarding Intelligence Agent', conservative: 25000, fullPotential: 60000 },
      ],
    }
  }

  // ── ROI CALCULATIONS ────────────────────────────────────────────────────────
  const totalEmployees = parseEmployeeCount(company.estimatedSize)
  const kwPct = Math.min(90, Math.max(10, intel.knowledgeWorkerPercent))
  const kw = Math.max(1, Math.round(totalEmployees * kwPct / 100))
  const wage = Math.min(150000, Math.max(45000, intel.fullyLoadedWageUSD))

  // MIND Platform value
  const searchSavings = Math.round(kw * wage * 0.20 * 0.35)
  const productivityValue = Math.round(kw * wage * 0.20)
  const mindConservative = productivityValue
  const mindFullPotential = searchSavings + productivityValue
  const hoursRecovered = Math.round(kw * 2000 * 0.20 * 0.35)

  // Agent Portfolio value (from Groq estimates)
  const agentVals: AgentValue[] = Array.isArray(intel.agentValues) ? intel.agentValues : []
  const agentConservative = agentVals.reduce((s, a) => s + (Number(a.conservative) || 0), 0)
  const agentFullPotential = agentVals.reduce((s, a) => s + (Number(a.fullPotential) || 0), 0)

  // Combined totals
  const combinedConservative = mindConservative + agentConservative
  const combinedFullPotential = mindFullPotential + agentFullPotential
  const fteEquivalent = Math.round(mindConservative / wage)

  // Business Builder ($50K + $10K/month) — ROI against MIND platform value only
  const bbSetup = 50000, bbMonthly = 10000
  const bbY1 = bbSetup + bbMonthly * 12
  const bbAnnual = bbMonthly * 12
  const bb5yr = bbY1 + bbAnnual * 4
  const bbY1ROIcons = Math.round((mindConservative / bbY1 - 1) * 100)
  const bbY1ROIfull = Math.round((mindFullPotential / bbY1 - 1) * 100)
  const bbPayback = Math.round(bbY1 / (mindConservative / 365))
  const bb5yrNetCons = mindConservative * 5 - bb5yr
  const bb5yrNetFull = mindFullPotential * 5 - bb5yr
  const bb5yrROICons = Math.round((bb5yrNetCons / bb5yr) * 100)
  const bb5yrROIFull = Math.round((bb5yrNetFull / bb5yr) * 100)

  // Self-Hosted ($49K + $5K/month) — ROI against MIND platform value only
  const shSetup = 49000, shMonthly = 5000
  const shY1 = shSetup + shMonthly * 12
  const shAnnual = shMonthly * 12
  const sh5yr = shY1 + shAnnual * 4
  const shY1ROIcons = Math.round((mindConservative / shY1 - 1) * 100)
  const shY1ROIfull = Math.round((mindFullPotential / shY1 - 1) * 100)
  const shPayback = Math.round(shY1 / (mindConservative / 365))
  const sh5yrNetCons = mindConservative * 5 - sh5yr
  const sh5yrNetFull = mindFullPotential * 5 - sh5yr
  const sh5yrROICons = Math.round((sh5yrNetCons / sh5yr) * 100)
  const sh5yrROIFull = Math.round((sh5yrNetFull / sh5yr) * 100)

  // ── BUILD DOCUMENT ──────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const children: any[] = []

  // ── DOCUMENT TITLE ─────────────────────────────────────────────────────────
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 60 },
    children: [new TextRun({ text: 'MIND Impact Assessment', font: 'Arial', size: 36, bold: true, color: NAVY, allCaps: true })],
  }))
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 200 },
    children: [new TextRun({ text: `Prepared exclusively for ${shortName}`, font: 'Arial', size: 22, color: DGRAY, italics: true })],
  }))

  // ── HEADER BANNER ──────────────────────────────────────────────────────────
  children.push(new Table({
    width: { size: CW, type: WidthType.DXA },
    columnWidths: [6800, 2920],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    borders: { top: nb(), bottom: nb(), left: nb(), right: nb(), insideH: nb(), insideV: nb() } as any,
    rows: [new TableRow({ children: [
      new TableCell({
        width: { size: 6800, type: WidthType.DXA }, shading: { fill: NAVY, type: ShadingType.CLEAR },
        borders: aNB(), margins: { top: 200, bottom: 200, left: 280, right: 160 }, verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({ spacing: { before: 0, after: 60 }, children: [new TextRun({ text: 'MIND IMPACT ASSESSMENT', font: 'Arial', size: 28, bold: true, color: WHITE, allCaps: true })] }),
          new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: `Prepared exclusively for ${shortName}`, font: 'Arial', size: 20, color: 'A9CCE3', italics: true })] }),
        ],
      }),
      new TableCell({
        width: { size: 2920, type: WidthType.DXA }, shading: { fill: BLUE, type: ShadingType.CLEAR },
        borders: aNB(), margins: { top: 200, bottom: 200, left: 160, right: 280 }, verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { before: 0, after: 60 }, children: [new TextRun({ text: 'Astra AI', font: 'Arial', size: 26, bold: true, color: WHITE })] }),
          new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { before: 0, after: 0 }, children: [new TextRun({ text: 'theastraway.com', font: 'Arial', size: 18, color: 'D6EAF8', italics: true })] }),
        ],
      }),
    ] })],
  }))

  // ── ORGANIZATION PROFILE ────────────────────────────────────────────────────
  children.push(spacer(200), sectionHeader('Organization Profile', NAVY), spacer(80))
  const orgRows: [string, string][] = [
    ['Company Name', shortName],
    ['Industry', company.industry],
    ['Headquarters', location],
    ['Business Type', company.businessType],
    ['Estimated Total Employees', company.estimatedSize],
    [`Estimated Knowledge Workers (${kwPct}%)`, `${kw} employees`],
    ['Avg. Fully-Loaded Employee Cost', `${fmt(wage)}/year`],
    ['Assessment Type', 'Projected — Based on Industry Research & McKinsey Benchmarks'],
  ].filter((row): row is [string, string] => Boolean(row[1]))

  children.push(new Table({
    width: { size: CW, type: WidthType.DXA },
    columnWidths: [3200, CW - 3200],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    borders: { top: nb(), bottom: nb(), left: nb(), right: nb(), insideH: nb(), insideV: nb() } as any,
    rows: orgRows.map(([label, value], i) => new TableRow({ children: [
      new TableCell({ width: { size: 3200, type: WidthType.DXA }, shading: { fill: i % 2 === 0 ? 'D6EAF8' : 'EAF2FB', type: ShadingType.CLEAR }, borders: aNB(), margins: { top: 100, bottom: 100, left: 140, right: 120 },
        children: [para(txt(label, { bold: true, color: NAVY, size: 20 }))] }),
      new TableCell({ width: { size: CW - 3200, type: WidthType.DXA }, shading: { fill: i % 2 === 0 ? LGRAY : WHITE, type: ShadingType.CLEAR }, borders: aNB(), margins: { top: 100, bottom: 100, left: 140, right: 120 },
        children: [para(txt(value, { size: 20 }))] }),
    ] })),
  }))
  children.push(spacer(60))
  children.push(new Paragraph({
    spacing: { before: 0, after: 160 },
    children: [new TextRun({ text: `* ${intel.knowledgeWorkerRationale} ${intel.wageRationale}`, font: 'Arial', size: 17, italics: true, color: FTNOTE })],
  }))

  // ── WHY [COMPANY] NEEDS MIND ─────────────────────────────────────────────
  children.push(spacer(120), sectionHeader(`Why ${shortName} Needs MIND`, NAVY), spacer(80))
  children.push(para(txt(intel.whyMindOpening, { size: 22 }), { after: 140 }))
  children.push(para(txt('Your institutional knowledge is your most valuable — and most vulnerable — asset.', { bold: true, color: NAVY, size: 22 }), { after: 140 }))
  children.push(para(txt(intel.institutionalKnowledgeRisk, { size: 22 }), { after: 140 }))
  children.push(para(txt('Research from McKinsey documents that knowledge workers spend 20–30% of their workday simply searching for information — hunting through emails, files, and systems, and asking colleagues the same questions repeatedly.', { size: 22 }), { after: 140 }))
  children.push(para(txt(`For your ${kw} knowledge workers, that's roughly ${Math.ceil(kw * 0.22)}–${Math.ceil(kw * 0.30)} employees' worth of productive time lost every year just to information search.`, { italic: true, color: BLUE, size: 22 }), { after: 0 }))

  // ── WHAT IS MIND ────────────────────────────────────────────────────────────
  children.push(spacer(200), sectionHeader('What Is MIND?', NAVY), spacer(80))
  children.push(para(txt('MIND is Astra AI\'s enterprise-grade Knowledge Graph RAG (Retrieval-Augmented Generation) platform — a proprietary AI infrastructure that captures 100% of your institutional knowledge into an intelligent, searchable knowledge graph.', { size: 22 }), { after: 140 }))
  children.push(para(txt('Unlike generic AI tools that hallucinate and guess, MIND achieves:', { bold: true, color: NAVY, size: 22 }), { after: 100 }))

  const mindStats = [
    '90%+ accuracy on complex queries (vs. 50–70% for traditional AI search)',
    '98–100% accuracy on structured queries',
    '~50% reduction in AI hallucinations compared to industry averages',
    'Sub-2-second response times',
    '400+ pre-built integrations with existing business systems (ERP, CRM, email, documents)',
    'Full deployment in 2–4 weeks — not months',
  ]
  children.push(new Table({
    width: { size: CW, type: WidthType.DXA }, columnWidths: [CW],
    borders: aB(BLUE),
    rows: [new TableRow({ children: [new TableCell({
      width: { size: CW, type: WidthType.DXA }, shading: { fill: 'EBF5FB', type: ShadingType.CLEAR },
      borders: aNB(), margins: { top: 160, bottom: 160, left: 240, right: 240 },
      children: mindStats.map((s, i) => para(txt(`• ${s}`, { size: 20, color: i === 0 ? NAVY : DGRAY, bold: i === 0 }), { after: i < mindStats.length - 1 ? 60 : 0 })),
    })] })],
  }))

  // ── ESTIMATED VALUE CALCULATION ─────────────────────────────────────────────
  children.push(spacer(200), sectionHeader(`Estimated Value Calculation — ${shortName}`, NAVY), spacer(80))
  children.push(para(txt('Methodology & Assumptions', { bold: true, color: NAVY, size: 22 }), { after: 100 }))

  children.push(new Table({
    width: { size: CW, type: WidthType.DXA },
    columnWidths: [2800, 2000, CW - 4800],
    borders: aB(MGRAY),
    rows: [
      new TableRow({ children: [
        new TableCell({ width: { size: 2800, type: WidthType.DXA }, shading: { fill: NAVY, type: ShadingType.CLEAR }, borders: aNB(), margins: CM,
          children: [para(txt('Assumption', { bold: true, color: WHITE, size: 20, caps: true }))] }),
        new TableCell({ width: { size: 2000, type: WidthType.DXA }, shading: { fill: NAVY, type: ShadingType.CLEAR }, borders: aNB(), margins: CM,
          children: [para(txt('Value', { bold: true, color: WHITE, size: 20, caps: true }))] }),
        new TableCell({ width: { size: CW - 4800, type: WidthType.DXA }, shading: { fill: NAVY, type: ShadingType.CLEAR }, borders: aNB(), margins: CM,
          children: [para(txt('Source', { bold: true, color: WHITE, size: 20, caps: true }))] }),
      ] }),
      ...[
        [`Knowledge Workers`, `${kw}`, `${kwPct}% of ${company.estimatedSize}`],
        [`Avg. Fully-Loaded Cost`, `${fmt(wage)}/yr`, intel.wageRationale],
        [`Search Time Baseline`, `20% of workday`, `McKinsey documented`],
        [`Search Time Reduction (RAG)`, `35%`, `McKinsey-documented RAG improvement`],
        [`Productivity Improvement`, `20% (conservative)`, `Documented commercial KG deployments`],
      ].map(([a, v, s], i) => new TableRow({ children: [
        new TableCell({ width: { size: 2800, type: WidthType.DXA }, shading: { fill: i % 2 === 0 ? 'D6EAF8' : 'EAF2FB', type: ShadingType.CLEAR }, borders: aNB(), margins: { top: 90, bottom: 90, left: 140, right: 120 },
          children: [para(txt(a, { bold: true, color: NAVY, size: 20 }))] }),
        new TableCell({ width: { size: 2000, type: WidthType.DXA }, shading: { fill: i % 2 === 0 ? LGRAY : WHITE, type: ShadingType.CLEAR }, borders: aNB(), margins: { top: 90, bottom: 90, left: 140, right: 120 },
          children: [para(txt(v, { bold: true, size: 20 }))] }),
        new TableCell({ width: { size: CW - 4800, type: WidthType.DXA }, shading: { fill: i % 2 === 0 ? LGRAY : WHITE, type: ShadingType.CLEAR }, borders: aNB(), margins: { top: 90, bottom: 90, left: 140, right: 120 },
          children: [para(txt(s, { size: 18, color: FTNOTE }))] }),
      ] })),
    ],
  }))

  children.push(spacer(160))
  children.push(para(txt('Search Time Savings', { bold: true, color: NAVY, size: 22 }), { after: 60 }))
  children.push(para(txt(`${kw} knowledge workers × ${fmt(wage)} × 20% (search time) × 35% (RAG reduction) = ${fmt(searchSavings)}/year in recovered search time`, { size: 21 }), { after: 60 }))
  children.push(para(txt(`This translates to approximately ${hoursRecovered.toLocaleString()} hours recovered annually — hours currently spent hunting for information.`, { italic: true, color: BLUE, size: 21 }), { after: 140 }))

  children.push(para(txt('Productivity Gains', { bold: true, color: NAVY, size: 22 }), { after: 60 }))
  children.push(para(txt(`${kw} knowledge workers × ${fmt(wage)} × 20% productivity improvement = ${fmt(productivityValue)}/year in productivity value`, { size: 21 }), { after: 60 }))
  children.push(para(txt('Both are independently realized — search time savings reflect direct time recovery, while productivity gains reflect the broader performance uplift when knowledge is instantly accessible.', { italic: true, color: BLUE, size: 21 }), { after: 140 }))
  children.push(para(txt(`${fmt(mindConservative)} in annual MIND Platform value alone is the equivalent of ${fteEquivalent > 0 ? fteEquivalent : 1} full-time employee${fteEquivalent !== 1 ? 's\'' : '\'s'} output returned to productive, value-creating work — before a single agent is deployed.`, { italic: true, color: BLUE, size: 22 }), { after: 0 }))

  // ── INVESTMENT & ROI ────────────────────────────────────────────────────────
  children.push(spacer(200), sectionHeader('Investment & ROI', NAVY), spacer(80))
  children.push(para(txt('Astra AI offers two MIND deployment paths for enterprise clients. Both deliver identical platform power — the right choice depends on your infrastructure preference and data sovereignty requirements.', { size: 22 }), { after: 160 }))

  const roiCols = [2800, (CW - 2800) >> 1, CW - 2800 - ((CW - 2800) >> 1)]
  children.push(new Table({
    width: { size: CW, type: WidthType.DXA },
    columnWidths: roiCols,
    borders: aB(MGRAY),
    rows: [
      new TableRow({ children: [
        new TableCell({ width: { size: roiCols[0], type: WidthType.DXA }, shading: { fill: LGRAY, type: ShadingType.CLEAR }, borders: aNB(), margins: CM,
          children: [para(txt('', { size: 18 }))] }),
        new TableCell({ width: { size: roiCols[1], type: WidthType.DXA }, shading: { fill: NAVY, type: ShadingType.CLEAR }, borders: aNB(), margins: CM,
          children: [
            para(txt('Business Builder', { bold: true, color: WHITE, size: 21, caps: true }), { after: 20 }),
            para(txt('★ Recommended', { color: GOLD, size: 17, bold: true }), { after: 20 }),
            para(txt('Build · Launch · Grow', { color: 'A9CCE3', size: 17, italic: true }), { after: 0 }),
          ] }),
        new TableCell({ width: { size: roiCols[2], type: WidthType.DXA }, shading: { fill: BLUE, type: ShadingType.CLEAR }, borders: aNB(), margins: CM,
          children: [
            para(txt('Self-Hosted MIND', { bold: true, color: WHITE, size: 21, caps: true }), { after: 40 }),
            para(txt('Own Your Infrastructure', { color: 'D6EAF8', size: 17, italic: true }), { after: 0 }),
          ] }),
      ] }),
      ...([
        ['Setup Investment', fmt(bbSetup), fmt(shSetup)],
        ['Monthly Ongoing', `${fmt(bbMonthly)}/month`, `${fmt(shMonthly)}/month`],
        ['Year 1 Total', fmt(bbY1), fmt(shY1)],
        ['Annual (Year 2+)', `${fmt(bbAnnual)}/year`, `${fmt(shAnnual)}/year`],
        ['5-Year Investment', fmt(bb5yr), fmt(sh5yr)],
      ] as [string, string, string][]).map(([label, bb, sh], i) => new TableRow({ children: [
        new TableCell({ width: { size: roiCols[0], type: WidthType.DXA }, shading: { fill: i % 2 === 0 ? 'D6EAF8' : 'EAF2FB', type: ShadingType.CLEAR }, borders: aNB(), margins: { top: 90, bottom: 90, left: 140, right: 120 },
          children: [para(txt(label, { bold: true, color: NAVY, size: 20 }))] }),
        new TableCell({ width: { size: roiCols[1], type: WidthType.DXA }, shading: { fill: i % 2 === 0 ? LGRAY : WHITE, type: ShadingType.CLEAR }, borders: aNB(), margins: { top: 90, bottom: 90, left: 140, right: 120 },
          children: [para(txt(bb, { bold: true, color: DGRAY, size: 20 }))] }),
        new TableCell({ width: { size: roiCols[2], type: WidthType.DXA }, shading: { fill: i % 2 === 0 ? LGRAY : WHITE, type: ShadingType.CLEAR }, borders: aNB(), margins: { top: 90, bottom: 90, left: 140, right: 120 },
          children: [para(txt(sh, { bold: true, color: DGRAY, size: 20 }))] }),
      ] })),
      new TableRow({ children: [
        new TableCell({ columnSpan: 3, width: { size: CW, type: WidthType.DXA }, shading: { fill: NAVY, type: ShadingType.CLEAR }, borders: aNB(), margins: { top: 80, bottom: 80, left: 140, right: 140 },
          children: [
            para(txt('Return on Investment — Conservative Range', { bold: true, color: WHITE, size: 20, caps: true }), { after: 20 }),
            para(txt('Based on Productivity Value · 20% knowledge worker time recovery', { italic: true, color: 'A9CCE3', size: 17 }), { after: 0 }),
          ] }),
      ] }),
      ...([
        ['Year 1 ROI (Conservative)', `${bbY1ROIcons}%`, `${shY1ROIcons}%`],
        ['Payback Period (Conservative)', `~${bbPayback} days`, `~${shPayback} days`],
        ['5-Year Net Benefit (Conservative)', fmt(bb5yrNetCons), fmt(sh5yrNetCons)],
        ['5-Year ROI (Conservative)', `${bb5yrROICons}%`, `${sh5yrROICons}%`],
      ] as [string, string, string][]).map(([label, bb, sh], i) => new TableRow({ children: [
        new TableCell({ width: { size: roiCols[0], type: WidthType.DXA }, shading: { fill: i % 2 === 0 ? 'D6EAF8' : 'EAF2FB', type: ShadingType.CLEAR }, borders: aNB(), margins: { top: 90, bottom: 90, left: 140, right: 120 },
          children: [para(txt(label, { bold: true, color: NAVY, size: 20 }))] }),
        new TableCell({ width: { size: roiCols[1], type: WidthType.DXA }, shading: { fill: i % 2 === 0 ? 'FEF9E7' : WHITE, type: ShadingType.CLEAR }, borders: aNB(), margins: { top: 90, bottom: 90, left: 140, right: 120 },
          children: [para(txt(bb, { bold: true, color: '7D6608', size: 20 }))] }),
        new TableCell({ width: { size: roiCols[2], type: WidthType.DXA }, shading: { fill: i % 2 === 0 ? 'FEF9E7' : WHITE, type: ShadingType.CLEAR }, borders: aNB(), margins: { top: 90, bottom: 90, left: 140, right: 120 },
          children: [para(txt(sh, { bold: true, color: '7D6608', size: 20 }))] }),
      ] })),
      new TableRow({ children: [
        new TableCell({ columnSpan: 3, width: { size: CW, type: WidthType.DXA }, shading: { fill: TEAL, type: ShadingType.CLEAR }, borders: aNB(), margins: { top: 80, bottom: 80, left: 140, right: 140 },
          children: [
            para(txt('Return on Investment — Full Potential Range', { bold: true, color: WHITE, size: 20, caps: true }), { after: 20 }),
            para(txt('Based on Productivity + Search Savings · Full Potential = Conservative × 1.35', { italic: true, color: 'A2D9CE', size: 17 }), { after: 0 }),
          ] }),
      ] }),
      ...([
        ['Year 1 ROI (Full Potential)', `${bbY1ROIfull}%`, `${shY1ROIfull}%`],
        ['5-Year Net Benefit (Full Potential)', fmt(bb5yrNetFull), fmt(sh5yrNetFull)],
        ['5-Year ROI (Full Potential)', `${bb5yrROIFull}%`, `${sh5yrROIFull}%`],
      ] as [string, string, string][]).map(([label, bb, sh], i) => new TableRow({ children: [
        new TableCell({ width: { size: roiCols[0], type: WidthType.DXA }, shading: { fill: i % 2 === 0 ? 'E8F8F5' : 'F0FBF8', type: ShadingType.CLEAR }, borders: aNB(), margins: { top: 90, bottom: 90, left: 140, right: 120 },
          children: [para(txt(label, { bold: true, color: TEAL, size: 20 }))] }),
        new TableCell({ width: { size: roiCols[1], type: WidthType.DXA }, shading: { fill: i % 2 === 0 ? 'D5F5E3' : WHITE, type: ShadingType.CLEAR }, borders: aNB(), margins: { top: 90, bottom: 90, left: 140, right: 120 },
          children: [para(txt(bb, { bold: true, color: '0E6655', size: 20 }))] }),
        new TableCell({ width: { size: roiCols[2], type: WidthType.DXA }, shading: { fill: i % 2 === 0 ? 'D5F5E3' : WHITE, type: ShadingType.CLEAR }, borders: aNB(), margins: { top: 90, bottom: 90, left: 140, right: 120 },
          children: [para(txt(sh, { bold: true, color: '0E6655', size: 20 }))] }),
      ] })),
    ],
  }))
  children.push(spacer(100))
  children.push(new Paragraph({
    spacing: { before: 0, after: 160 },
    children: [new TextRun({ text: 'Business Builder includes dedicated implementation, ongoing optimization, training, and growth consulting directly from the Astra AI team — the support infrastructure that drives these results for most organizations. Self-Hosted ROI projections are achievable for organizations with proficient internal IT infrastructure management and self-directed platform optimization.', font: 'Arial', size: 17, italics: true, color: FTNOTE })],
  }))

  // ── SPECIFIC IMPACT AREAS ───────────────────────────────────────────────────
  if (intel.specificImpactAreas?.length > 0) {
    children.push(spacer(120), sectionHeader(`Specific Impact Areas — ${shortName}`, NAVY), spacer(80))
    for (const area of intel.specificImpactAreas) {
      children.push(para(txt(area.title, { bold: true, color: NAVY, size: 22 }), { after: 60 }))
      children.push(para(txt(area.body, { size: 21 }), { after: 140 }))
    }
  }

  // ── THE TRANSFORMATIONAL 10 ─────────────────────────────────────────────────
  children.push(spacer(200), sectionHeader('The Transformational 10 — Your MIND-Powered Agent Suite', NAVY), spacer(80))
  children.push(para(txt('MIND isn\'t just a knowledge system — it\'s the foundation that makes AI agents actually work.', { bold: true, color: NAVY, size: 22 }), { after: 120 }))
  children.push(para(txt('Generic AI tools fail because they don\'t understand your business context. Agents powered by MIND\'s knowledge graph have access to your complete institutional memory — every process, every decision, every customer nuance. The result: agents that don\'t hallucinate, don\'t guess, and deliver measurable ROI from day one.', { size: 22 }), { after: 120 }))
  children.push(para(txt(intel.agentAmplifierNote, { size: 22, italic: true, color: BLUE }), { after: 160 }))

  const valByName = new Map(agentVals.map(v => [v.name.toLowerCase(), v]))

  const allT10 = [
    ...aiaAgents.map((a, i) => {
      const v = valByName.get(a.name.toLowerCase())
      return {
        num: i + 1,
        name: a.name,
        category: a.category,
        description: a.description,
        impact: `${a.estimatedTimeSavedMonthly && a.estimatedTimeSavedMonthly !== 'N/A' ? 'Est. time saved: ' + a.estimatedTimeSavedMonthly : ''}`.trim(),
        conservative: v?.conservative ?? 0,
        fullPotential: v?.fullPotential ?? 0,
        isMind: false,
      }
    }),
    ...MIND_AGENTS.map((a, i) => {
      const v = valByName.get(a.name.toLowerCase())
      return {
        num: aiaAgents.length + i + 1,
        name: a.name,
        category: a.category,
        description: a.description,
        impact: a.impact,
        conservative: v?.conservative ?? 0,
        fullPotential: v?.fullPotential ?? 0,
        isMind: true,
      }
    }),
  ]

  const t10ColW = [600, 2800, CW - 3400]
  children.push(new Table({
    width: { size: CW, type: WidthType.DXA },
    columnWidths: t10ColW,
    borders: aB(MGRAY),
    rows: [
      new TableRow({ children: [
        new TableCell({ columnSpan: 3, width: { size: CW, type: WidthType.DXA }, shading: { fill: NAVY, type: ShadingType.CLEAR }, borders: aNB(), margins: { top: 100, bottom: 100, left: 160, right: 160 },
          children: [para(txt('The Transformational 10', { bold: true, color: WHITE, size: 22, caps: true }))] }),
      ] }),
      ...allT10.map(agent => {
        const numColor = agent.isMind ? TEAL : BLUE
        const bgLeft = agent.isMind ? 'E8F8F5' : 'EBF5FB'
        const bgRight = agent.isMind ? 'F0FBF8' : LGRAY
        const sm = { top: 100, bottom: 100, left: 120, right: 120 }
        return new TableRow({ children: [
          new TableCell({ width: { size: t10ColW[0], type: WidthType.DXA }, shading: { fill: numColor, type: ShadingType.CLEAR }, borders: aNB(), margins: sm, verticalAlign: VerticalAlign.CENTER,
            children: [para(txt(String(agent.num), { bold: true, color: WHITE, size: 22 }), { align: AlignmentType.CENTER })] }),
          new TableCell({ width: { size: t10ColW[1], type: WidthType.DXA }, shading: { fill: bgLeft, type: ShadingType.CLEAR }, borders: aNB(), margins: sm,
            children: [
              para(txt(agent.category, { bold: true, color: agent.isMind ? TEAL : BLUE, size: 18 }), { after: 40 }),
              para(txt(agent.name, { bold: true, color: NAVY, size: 21 }), { after: agent.isMind ? 40 : 0 }),
              ...(agent.isMind ? [para(txt('MIND Infrastructure', { color: TEAL, size: 17, italic: true }), { after: 0 })] : []),
            ] }),
          new TableCell({ width: { size: t10ColW[2], type: WidthType.DXA }, shading: { fill: bgRight, type: ShadingType.CLEAR }, borders: aNB(), margins: sm,
            children: [
              para(txt(agent.description, { size: 20 }), { after: 60 }),
              ...(agent.impact ? [para(txt(agent.impact, { size: 18, color: '7D6608', bold: true }), { after: 60 })] : []),
              ...(agent.conservative > 0 ? [para(txt(`Conservative: ${fmt(agent.conservative)}  |  Full Potential: ${fmt(agent.fullPotential)}`, { size: 17, color: agent.isMind ? TEAL : BLUE, bold: true }), { after: 0 })] : []),
            ] }),
        ] })
      }),
    ],
  }))

  children.push(spacer(100))
  children.push(para(txt('When you layer agents on top of MIND\'s knowledge graph, the agents get smarter as you feed them more data through the infrastructure, and the infrastructure gets optimized based on how the agents perform. Value compounds over time — this isn\'t a static tool, it\'s a system that grows with your business.', { size: 22 }), { after: 0 }))

  // ── AGENT PORTFOLIO VALUE ───────────────────────────────────────────────────
  children.push(spacer(200), sectionHeader('Agent Portfolio Value Summary', NAVY), spacer(80))
  children.push(para(txt('The following table reflects estimated annual value for each of the 10 agents specific to your organization — independently of the MIND Platform value already calculated above.', { size: 22 }), { after: 140 }))

  const portColW = [3800, (CW - 3800) >> 1, CW - 3800 - ((CW - 3800) >> 1)]
  children.push(new Table({
    width: { size: CW, type: WidthType.DXA },
    columnWidths: portColW,
    borders: aB(MGRAY),
    rows: [
      new TableRow({ children: [
        new TableCell({ width: { size: portColW[0], type: WidthType.DXA }, shading: { fill: NAVY, type: ShadingType.CLEAR }, borders: aNB(), margins: CM,
          children: [para(txt('Agent', { bold: true, color: WHITE, size: 20, caps: true }))] }),
        new TableCell({ width: { size: portColW[1], type: WidthType.DXA }, shading: { fill: NAVY, type: ShadingType.CLEAR }, borders: aNB(), margins: CM,
          children: [para(txt('Conservative', { bold: true, color: WHITE, size: 20, caps: true }))] }),
        new TableCell({ width: { size: portColW[2], type: WidthType.DXA }, shading: { fill: TEAL, type: ShadingType.CLEAR }, borders: aNB(), margins: CM,
          children: [para(txt('Full Potential', { bold: true, color: WHITE, size: 20, caps: true }))] }),
      ] }),
      ...allT10.map((agent, i) => new TableRow({ children: [
        new TableCell({ width: { size: portColW[0], type: WidthType.DXA }, shading: { fill: agent.isMind ? (i % 2 === 0 ? 'E8F8F5' : 'F0FBF8') : (i % 2 === 0 ? 'D6EAF8' : 'EAF2FB'), type: ShadingType.CLEAR }, borders: aNB(), margins: { top: 90, bottom: 90, left: 140, right: 120 },
          children: [
            para(txt(agent.name, { bold: true, color: agent.isMind ? TEAL : NAVY, size: 19 }), { after: agent.isMind ? 30 : 0 }),
            ...(agent.isMind ? [para(txt('MIND Infrastructure', { color: TEAL, size: 16, italic: true }), { after: 0 })] : []),
          ] }),
        new TableCell({ width: { size: portColW[1], type: WidthType.DXA }, shading: { fill: i % 2 === 0 ? LGRAY : WHITE, type: ShadingType.CLEAR }, borders: aNB(), margins: { top: 90, bottom: 90, left: 140, right: 120 },
          children: [para(txt(agent.conservative > 0 ? fmt(agent.conservative) : '—', { bold: true, color: DGRAY, size: 19 }))] }),
        new TableCell({ width: { size: portColW[2], type: WidthType.DXA }, shading: { fill: i % 2 === 0 ? LGRAY : WHITE, type: ShadingType.CLEAR }, borders: aNB(), margins: { top: 90, bottom: 90, left: 140, right: 120 },
          children: [para(txt(agent.fullPotential > 0 ? fmt(agent.fullPotential) : '—', { bold: true, color: DGRAY, size: 19 }))] }),
      ] })),
      // Totals row
      new TableRow({ children: [
        new TableCell({ width: { size: portColW[0], type: WidthType.DXA }, shading: { fill: NAVY, type: ShadingType.CLEAR }, borders: aNB(), margins: { top: 110, bottom: 110, left: 140, right: 120 },
          children: [para(txt('Total Agent Portfolio (Annual)', { bold: true, color: WHITE, size: 20 }))] }),
        new TableCell({ width: { size: portColW[1], type: WidthType.DXA }, shading: { fill: '1A3A5C', type: ShadingType.CLEAR }, borders: aNB(), margins: { top: 110, bottom: 110, left: 140, right: 120 },
          children: [para(txt(fmt(agentConservative), { bold: true, color: WHITE, size: 20 }))] }),
        new TableCell({ width: { size: portColW[2], type: WidthType.DXA }, shading: { fill: '0E8070', type: ShadingType.CLEAR }, borders: aNB(), margins: { top: 110, bottom: 110, left: 140, right: 120 },
          children: [para(txt(fmt(agentFullPotential), { bold: true, color: WHITE, size: 20 }))] }),
      ] }),
    ],
  }))
  children.push(spacer(80))
  children.push(new Paragraph({
    spacing: { before: 0, after: 160 },
    children: [new TextRun({ text: 'Agent values are estimated based on this organization\'s specific profile, industry, and geography. Actual results will vary based on implementation depth, team adoption, and integration with existing systems. Individual agent ROI is realized incrementally as each agent is deployed and optimized.', font: 'Arial', size: 17, italics: true, color: FTNOTE })],
  }))

  // ── COMBINED ROI SUMMARY TABLE ──────────────────────────────────────────────
  children.push(spacer(200), sectionHeader('Combined ROI Summary', NAVY), spacer(80))
  children.push(para(txt('The total value of the MIND ecosystem — platform infrastructure plus The Transformational 10 agent suite — is shown below across both the conservative and full potential range.', { size: 22 }), { after: 140 }))

  const valCols = [3600, (CW - 3600) >> 1, CW - 3600 - ((CW - 3600) >> 1)]
  children.push(new Table({
    width: { size: CW, type: WidthType.DXA },
    columnWidths: valCols,
    borders: aB(MGRAY),
    rows: [
      new TableRow({ children: [
        new TableCell({ width: { size: valCols[0], type: WidthType.DXA }, shading: { fill: LGRAY, type: ShadingType.CLEAR }, borders: aNB(), margins: CM,
          children: [para(txt('Value Source', { bold: true, color: NAVY, size: 20, caps: true }))] }),
        new TableCell({ width: { size: valCols[1], type: WidthType.DXA }, shading: { fill: NAVY, type: ShadingType.CLEAR }, borders: aNB(), margins: CM,
          children: [
            para(txt('Conservative', { bold: true, color: WHITE, size: 20, caps: true }), { after: 20 }),
            para(txt('Productivity Value', { italic: true, color: 'A9CCE3', size: 17 }), { after: 0 }),
          ] }),
        new TableCell({ width: { size: valCols[2], type: WidthType.DXA }, shading: { fill: TEAL, type: ShadingType.CLEAR }, borders: aNB(), margins: CM,
          children: [
            para(txt('Full Potential', { bold: true, color: WHITE, size: 20, caps: true }), { after: 20 }),
            para(txt('Productivity + Search Savings', { italic: true, color: 'A2D9CE', size: 17 }), { after: 0 }),
          ] }),
      ] }),
      new TableRow({ children: [
        new TableCell({ width: { size: valCols[0], type: WidthType.DXA }, shading: { fill: 'D6EAF8', type: ShadingType.CLEAR }, borders: aNB(), margins: { top: 100, bottom: 100, left: 140, right: 120 },
          children: [para(txt('MIND Platform', { bold: true, color: NAVY, size: 20 }))] }),
        new TableCell({ width: { size: valCols[1], type: WidthType.DXA }, shading: { fill: LGRAY, type: ShadingType.CLEAR }, borders: aNB(), margins: { top: 100, bottom: 100, left: 140, right: 120 },
          children: [para(txt(fmt(mindConservative), { bold: true, color: DGRAY, size: 20 }))] }),
        new TableCell({ width: { size: valCols[2], type: WidthType.DXA }, shading: { fill: LGRAY, type: ShadingType.CLEAR }, borders: aNB(), margins: { top: 100, bottom: 100, left: 140, right: 120 },
          children: [para(txt(fmt(mindFullPotential), { bold: true, color: DGRAY, size: 20 }))] }),
      ] }),
      new TableRow({ children: [
        new TableCell({ width: { size: valCols[0], type: WidthType.DXA }, shading: { fill: 'EAF2FB', type: ShadingType.CLEAR }, borders: aNB(), margins: { top: 100, bottom: 100, left: 140, right: 120 },
          children: [para(txt('Agent Portfolio (10 Agents)', { bold: true, color: NAVY, size: 20 }))] }),
        new TableCell({ width: { size: valCols[1], type: WidthType.DXA }, shading: { fill: WHITE, type: ShadingType.CLEAR }, borders: aNB(), margins: { top: 100, bottom: 100, left: 140, right: 120 },
          children: [para(txt(fmt(agentConservative), { bold: true, color: DGRAY, size: 20 }))] }),
        new TableCell({ width: { size: valCols[2], type: WidthType.DXA }, shading: { fill: WHITE, type: ShadingType.CLEAR }, borders: aNB(), margins: { top: 100, bottom: 100, left: 140, right: 120 },
          children: [para(txt(fmt(agentFullPotential), { bold: true, color: DGRAY, size: 20 }))] }),
      ] }),
      new TableRow({ children: [
        new TableCell({ width: { size: valCols[0], type: WidthType.DXA }, shading: { fill: NAVY, type: ShadingType.CLEAR }, borders: aNB(), margins: { top: 110, bottom: 110, left: 140, right: 120 },
          children: [para(txt('Combined Annual Value', { bold: true, color: WHITE, size: 21 }))] }),
        new TableCell({ width: { size: valCols[1], type: WidthType.DXA }, shading: { fill: '1A3A5C', type: ShadingType.CLEAR }, borders: aNB(), margins: { top: 110, bottom: 110, left: 140, right: 120 },
          children: [para(txt(fmt(combinedConservative), { bold: true, color: WHITE, size: 21 }))] }),
        new TableCell({ width: { size: valCols[2], type: WidthType.DXA }, shading: { fill: '0E8070', type: ShadingType.CLEAR }, borders: aNB(), margins: { top: 110, bottom: 110, left: 140, right: 120 },
          children: [para(txt(fmt(combinedFullPotential), { bold: true, color: WHITE, size: 21 }))] }),
      ] }),
      new TableRow({ children: [
        new TableCell({ width: { size: valCols[0], type: WidthType.DXA }, shading: { fill: GOLD, type: ShadingType.CLEAR }, borders: aNB(), margins: { top: 110, bottom: 110, left: 140, right: 120 },
          children: [para(txt('Combined 5-Year Value', { bold: true, color: WHITE, size: 21 }))] }),
        new TableCell({ width: { size: valCols[1], type: WidthType.DXA }, shading: { fill: 'B7950B', type: ShadingType.CLEAR }, borders: aNB(), margins: { top: 110, bottom: 110, left: 140, right: 120 },
          children: [para(txt(fmt(combinedConservative * 5), { bold: true, color: WHITE, size: 21 }))] }),
        new TableCell({ width: { size: valCols[2], type: WidthType.DXA }, shading: { fill: '9A7D0A', type: ShadingType.CLEAR }, borders: aNB(), margins: { top: 110, bottom: 110, left: 140, right: 120 },
          children: [para(txt(fmt(combinedFullPotential * 5), { bold: true, color: WHITE, size: 21 }))] }),
      ] }),
    ],
  }))
  children.push(spacer(80))
  children.push(new Paragraph({
    spacing: { before: 0, after: 160 },
    children: [new TextRun({ text: 'Conservative reflects documented productivity benchmarks with standard adoption. Full Potential reflects comprehensive platform and agent adoption — actual results will vary based on implementation depth, usage, and organizational engagement. MIND Platform and Agent Portfolio values are independently generated; some productivity gains may be realized across both layers.', font: 'Arial', size: 17, italics: true, color: FTNOTE })],
  }))

  // ── COMPETITIVE URGENCY ─────────────────────────────────────────────────────
  children.push(spacer(200), sectionHeader('The Cost of Waiting', NAVY), spacer(80))
  children.push(para(txt(intel.competitiveUrgencyNote, { size: 22 }), { after: 140 }))
  children.push(para(txt('Companies attempting to build custom knowledge graph infrastructure face:', { bold: true, color: NAVY, size: 22 }), { after: 80 }))
  children.push(new Table({
    width: { size: CW, type: WidthType.DXA }, columnWidths: [CW],
    borders: aB(MGRAY),
    rows: [new TableRow({ children: [new TableCell({
      width: { size: CW, type: WidthType.DXA }, shading: { fill: 'FEF9E7', type: ShadingType.CLEAR },
      borders: aNB(), margins: { top: 140, bottom: 140, left: 220, right: 220 },
      children: [
        para(txt(`• $1.9M–$2.7M in Year 1 costs alone — vs. ${shortName}'s entire first-year investment with Astra AI`, { size: 21, color: DGRAY }), { after: 60 }),
        para(txt(`• $7.8M–$12M over five years — vs. ${shortName}'s 5-year investment with Astra AI (96% less expensive)`, { size: 21, color: DGRAY }), { after: 60 }),
        para(txt('• 6–24 month implementation timelines (vs. 2–4 weeks with MIND)', { size: 21, color: DGRAY }), { after: 60 }),
        para(txt('• 87% documented failure rate for DIY knowledge graph builds', { size: 21, color: DGRAY }), { after: 0 }),
      ],
    })] })],
  }))
  children.push(spacer(100))
  children.push(para(txt(`Every month without MIND is a month your team spends ${hoursRecovered.toLocaleString()}+ hours searching instead of creating, deciding, and growing. Every departing employee takes irreplaceable institutional knowledge with them. Every delayed decision costs margin.`, { size: 22 }), { after: 0 }))

  // ── CTA BOX ─────────────────────────────────────────────────────────────────
  children.push(spacer(200), new Table({
    width: { size: CW, type: WidthType.DXA }, columnWidths: [CW],
    borders: aB(GOLD),
    rows: [new TableRow({ children: [new TableCell({
      width: { size: CW, type: WidthType.DXA }, shading: { fill: 'FDFEFE', type: ShadingType.CLEAR },
      borders: aNB(), margins: { top: 240, bottom: 240, left: 280, right: 280 },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 120 }, children: [new TextRun({ text: 'Ready to See What MIND Can Do?', font: 'Arial', size: 28, bold: true, color: NAVY })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 140 }, children: [new TextRun({ text: `The best way to evaluate MIND for ${shortName} is a 30-minute Discovery Call — no pressure, no commitment. We'll walk through exactly how MIND would deploy inside your operation, model the ROI against your actual headcount, and answer your questions honestly.`, font: 'Arial', size: 21, color: DGRAY })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 140 }, children: [new TextRun({ text: 'The companies that build knowledge infrastructure now will have an advantage competitors simply cannot replicate by arriving late.', font: 'Arial', size: 21, bold: true, color: BLUE, italics: true })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 80 }, children: [new TextRun({ text: 'Schedule your complimentary 30-minute Discovery Call:', font: 'Arial', size: 21, color: DGRAY })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0 }, children: [new ExternalHyperlink({ link: 'https://theastraway.com/rep/scott-simon', children: [new TextRun({ text: 'theastraway.com/rep/scott-simon', font: 'Arial', size: 23, bold: true, color: BLUE, underline: {} })] })] }),
      ],
    })] })],
  }))

  // ── CONSULTANT CARD ─────────────────────────────────────────────────────────
  children.push(spacer(200), sectionHeader('Your Astra AI Consultant', NAVY), spacer(80))
  children.push(new Table({
    width: { size: CW, type: WidthType.DXA },
    columnWidths: [1600, CW - 1600],
    borders: aB(MGRAY),
    rows: [new TableRow({ children: [
      new TableCell({
        width: { size: 1600, type: WidthType.DXA }, shading: { fill: NAVY, type: ShadingType.CLEAR },
        borders: aNB(), margins: { top: 160, bottom: 160, left: 160, right: 160 }, verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 60 }, children: [new TextRun({ text: 'SS', font: 'Arial', size: 52, bold: true, color: WHITE })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0 }, children: [new TextRun({ text: 'Astra AI', font: 'Arial', size: 17, color: 'A9CCE3' })] }),
        ],
      }),
      new TableCell({
        width: { size: CW - 1600, type: WidthType.DXA }, shading: { fill: LGRAY, type: ShadingType.CLEAR },
        borders: aNB(), margins: { top: 160, bottom: 160, left: 200, right: 200 },
        children: [
          para(txt('Scott Simon', { bold: true, color: NAVY, size: 26 }), { after: 60 }),
          para(txt('AI Consultant | Astra AI', { color: BLUE, size: 21, italic: true }), { after: 100 }),
          para(txt('Watertown, SD 57201', { color: DGRAY, size: 20 }), { after: 60 }),
          para(txt('(605) 228-2509', { color: DGRAY, size: 20, bold: true }), { after: 60 }),
          new Paragraph({ spacing: { before: 0, after: 60 }, children: [new ExternalHyperlink({ link: 'https://theastraway.com/rep/scott-simon', children: [new TextRun({ text: 'theastraway.com/rep/scott-simon', font: 'Arial', size: 20, color: BLUE, underline: {} })] })] }),
          para(txt('Enterprise AI Platform | Knowledge Graph RAG | Agentic Automation', { color: FTNOTE, size: 18, italic: true }), { after: 0 }),
        ],
      }),
    ] })],
  }))

  // ── FOOTER ───────────────────────────────────────────────────────────────────
  children.push(spacer(160), rule(LGRAY, 80, 80))
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0 },
    children: [new TextRun({ text: `This MIND Impact Assessment was prepared by Astra AI exclusively for ${shortName} | ${location} | theastraway.com | Confidential — Not for Distribution`, font: 'Arial', size: 16, color: FTNOTE, italics: true })],
  }))

  // ── METHODOLOGY & DISCLAIMERS ───────────────────────────────────────────────
  children.push(spacer(180), new Table({
    width: { size: CW, type: WidthType.DXA }, columnWidths: [CW],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    borders: { top: nb(), bottom: nb(), left: nb(), right: nb(), insideH: nb(), insideV: nb() } as any,
    rows: [new TableRow({ children: [new TableCell({
      width: { size: CW, type: WidthType.DXA }, shading: { fill: NAVY, type: ShadingType.CLEAR },
      borders: aNB(), margins: { top: 140, bottom: 140, left: 280, right: 280 },
      children: [
        new Paragraph({ spacing: { before: 0, after: 30 }, children: [new TextRun({ text: 'METHODOLOGY & DISCLAIMERS', font: 'Arial', size: 22, bold: true, color: WHITE, allCaps: true })] }),
      ],
    })] })],
  }))
  children.push(spacer(100))
  children.push(new Paragraph({
    spacing: { before: 0, after: 100 },
    children: [new TextRun({ text: 'All projections in this report are modeled estimates based on documented third-party research (McKinsey) and measured Astra AI deployment outcomes. They are not guarantees of specific results. Actual ROI will be measured post-deployment through monthly analytics tracking hours saved, search time reduction, query accuracy, response times, and hallucination rates.', font: 'Arial', size: 18, color: FTNOTE })],
  }))
  children.push(new Paragraph({
    spacing: { before: 0, after: 100 },
    children: [new TextRun({ text: `Baseline assumptions: Search time percentage: 20% (McKinsey); Search time reduction: 35% (McKinsey-documented RAG improvement); Productivity improvement: 20% (documented commercial knowledge graph deployments); Fully-loaded employee cost: ${fmt(wage)}/year (${intel.wageRationale}). Knowledge worker estimate of ${kw} employees (${kwPct}%) reflects roles involving significant information search, synthesis, and decision-making.`, font: 'Arial', size: 18, color: FTNOTE })],
  }))
  children.push(new Paragraph({
    spacing: { before: 0, after: 0 },
    children: [new TextRun({ text: 'ROI calculations reflect the infrastructure ownership model. Cost projections do not include client-side infrastructure costs (cloud hosting, IT support) which vary by organization. Investment figures are estimates — final engagement terms are confirmed during the discovery process.', font: 'Arial', size: 18, color: FTNOTE })],
  }))
  children.push(spacer(80), rule(LGRAY, 60, 60))
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0 },
    children: [new TextRun({ text: 'Astra AI | theastraway.com | For companies that intend to move first.', font: 'Arial', size: 16, color: FTNOTE, italics: true })],
  }))

  // ── PACKAGE & RETURN ────────────────────────────────────────────────────────
  const doc = new Document({
    numbering: {
      config: [{ reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }],
    },
    styles: {
      default: { document: { run: { font: 'Arial', size: 22, color: DGRAY } } },
    },
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1080, right: 1260, bottom: 1080, left: 1260 },
        },
      },
      children,
    }],
  })

  const buffer = await Packer.toBuffer(doc)
  const safeName = shortName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').slice(0, 40)

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="MIA_${safeName}.docx"`,
    },
  })
}
