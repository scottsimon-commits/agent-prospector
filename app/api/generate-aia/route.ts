import { NextRequest } from 'next/server'
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType, VerticalAlign,
  LevelFormat, ExternalHyperlink, ImageRun, TextWrappingType, TextWrappingSide,
  HorizontalPositionAlign, HorizontalPositionRelativeFrom, VerticalPositionRelativeFrom,
} from 'docx'
import fs from 'fs'
import path from 'path'
import type { BusinessProspectResult } from '@/lib/types'

const NAVY = '1F3864', BLUE = '2E75B6', TEAL = '17A589', GOLD = 'D4AC0D'
const LGRAY = 'F2F4F7', MGRAY = 'BDC3C7', DGRAY = '555555', WHITE = 'FFFFFF', FTNOTE = '444444'
const CW = 9720 // content width DXA (1260 margins each side on 12240 page)

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

function primaryAgentCard(
  rank: number, name: string, tagline: string,
  companyName: string, whyThisCompany: string, description: string, impact: string
) {
  return new Table({
    width: { size: CW, type: WidthType.DXA },
    columnWidths: [1200, CW - 1200],
    borders: aB(MGRAY),
    rows: [
      new TableRow({ children: [
        new TableCell({ width: { size: 1200, type: WidthType.DXA }, shading: { fill: NAVY, type: ShadingType.CLEAR }, borders: aNB(), margins: CM, verticalAlign: VerticalAlign.CENTER,
          children: [para(txt(`#${rank}`, { bold: true, color: WHITE, size: 20 }), { align: AlignmentType.CENTER })] }),
        new TableCell({ width: { size: CW - 1200, type: WidthType.DXA }, shading: { fill: BLUE, type: ShadingType.CLEAR }, borders: aNB(), margins: CM,
          children: [para(txt(name, { bold: true, color: WHITE, size: 24 }))] }),
      ] }),
      new TableRow({ children: [
        new TableCell({ columnSpan: 2, width: { size: CW, type: WidthType.DXA }, shading: { fill: 'EAF2FB', type: ShadingType.CLEAR }, borders: aNB(), margins: CM,
          children: [para(txt(tagline, { italic: true, color: BLUE, size: 21 }))] }),
      ] }),
      new TableRow({ children: [
        new TableCell({ width: { size: 1800, type: WidthType.DXA }, shading: { fill: TEAL, type: ShadingType.CLEAR }, borders: aNB(), margins: CM, verticalAlign: VerticalAlign.CENTER,
          children: [para(txt(`Why ${companyName}`, { bold: true, color: WHITE, size: 18 }), { align: AlignmentType.CENTER })] }),
        new TableCell({ width: { size: CW - 1800, type: WidthType.DXA }, shading: { fill: 'E8F8F5', type: ShadingType.CLEAR }, borders: aNB(), margins: CM,
          children: [para(txt(whyThisCompany, { color: TEAL, size: 20 }))] }),
      ] }),
      new TableRow({ children: [
        new TableCell({ columnSpan: 2, width: { size: CW, type: WidthType.DXA }, shading: { fill: LGRAY, type: ShadingType.CLEAR }, borders: aNB(), margins: CM,
          children: [para(txt(description, { size: 21 }))] }),
      ] }),
      new TableRow({ children: [
        new TableCell({ width: { size: 1200, type: WidthType.DXA }, shading: { fill: GOLD, type: ShadingType.CLEAR }, borders: aNB(), margins: CM, verticalAlign: VerticalAlign.CENTER,
          children: [para(txt('IMPACT', { bold: true, color: WHITE, size: 19, caps: true }), { align: AlignmentType.CENTER })] }),
        new TableCell({ width: { size: CW - 1200, type: WidthType.DXA }, shading: { fill: 'FEF9E7', type: ShadingType.CLEAR }, borders: aNB(), margins: CM,
          children: [para(txt(impact, { bold: true, color: '7D6608', size: 21 }))] }),
      ] }),
    ],
  })
}

function expansionRow(rank: number, category: string, name: string, description: string) {
  const sm = { top: 100, bottom: 100, left: 140, right: 140 }
  return new TableRow({ children: [
    new TableCell({ width: { size: 400, type: WidthType.DXA }, shading: { fill: TEAL, type: ShadingType.CLEAR }, borders: aNB(), margins: sm, verticalAlign: VerticalAlign.CENTER,
      children: [para(txt(String(rank), { bold: true, color: WHITE, size: 20 }), { align: AlignmentType.CENTER })] }),
    new TableCell({ width: { size: 2300, type: WidthType.DXA }, shading: { fill: 'E8F8F5', type: ShadingType.CLEAR }, borders: aNB(), margins: sm,
      children: [para(txt(category, { bold: true, color: TEAL, size: 19 })), para(txt(name, { bold: true, color: NAVY, size: 20 }), { after: 0 })] }),
    new TableCell({ width: { size: CW - 2700, type: WidthType.DXA }, shading: { fill: LGRAY, type: ShadingType.CLEAR }, borders: aNB(), margins: sm,
      children: [para(txt(description, { size: 21 }))] }),
  ] })
}

export async function POST(req: NextRequest) {
  let body: unknown
  try { body = await req.json() } catch { return new Response('Invalid JSON', { status: 400 }) }

  const { companyName, location, result } = body as {
    companyName: string
    location: string
    result: BusinessProspectResult
  }

  if (!companyName || !result?.company || !result?.recommendations) {
    return new Response('Missing required fields', { status: 400 })
  }

  const { company, recommendations } = result
  const primaryAgents = recommendations.filter(r => r.tier === 'primary').slice(0, 2)
  const expansionAgents = recommendations.filter(r => r.tier === 'expansion').slice(0, 5)
  const shortName = company.name || companyName

  let graphBuffer: Buffer | null = null
  try {
    graphBuffer = fs.readFileSync(path.join(process.cwd(), 'public', 'knowledge-graph.jpg'))
  } catch { graphBuffer = null }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const children: any[] = []

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
          new Paragraph({ spacing: { before: 0, after: 60 }, children: [new TextRun({ text: 'AGENTIC IMPACT ASSESSMENT', font: 'Arial', size: 28, bold: true, color: WHITE, allCaps: true })] }),
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

  // ── ABOUT THIS ASSESSMENT ──────────────────────────────────────────────────
  children.push(spacer(200), sectionHeader('About This Assessment', NAVY), spacer(80))
  children.push(para(txt(`This Agentic Impact Assessment (AIA) was prepared specifically for ${shortName} after a review of your business operations, service offerings, and the challenges common to businesses in your industry. The purpose of this report is simple: to identify specific areas where AI automation can deliver immediate, measurable value — with a clear path to scale from there.`), { after: 140 }))
  children.push(para(txt("You don't need to overhaul your entire operation to benefit from AI. One well-chosen agent, solving one real problem, can return its investment many times over.", { italic: true, color: BLUE, size: 22 }), { after: 0 }))

  // ── BUSINESS SNAPSHOT ──────────────────────────────────────────────────────
  children.push(spacer(200), sectionHeader(`Business Snapshot — ${shortName}`, NAVY), spacer(80))
  const snapshotData = [
    ['Business Type', company.businessType],
    ['Industry', company.industry],
    ['Location', location],
    ['Estimated Size', company.estimatedSize],
    ['Primary Operations', company.primaryOperations.join(', ')],
    ['Technology Profile', company.technologyProfile],
  ].filter(([, v]) => v && v.length > 0)
  children.push(new Table({
    width: { size: CW, type: WidthType.DXA },
    columnWidths: [2400, CW - 2400],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    borders: { top: nb(), bottom: nb(), left: nb(), right: nb(), insideH: nb(), insideV: nb() } as any,
    rows: snapshotData.map(([label, value], i) => new TableRow({ children: [
      new TableCell({ width: { size: 2400, type: WidthType.DXA }, shading: { fill: i % 2 === 0 ? 'D6EAF8' : 'EAF2FB', type: ShadingType.CLEAR }, borders: aNB(), margins: { top: 100, bottom: 100, left: 140, right: 120 },
        children: [para(txt(label, { bold: true, color: NAVY, size: 20 }))] }),
      new TableCell({ width: { size: CW - 2400, type: WidthType.DXA }, shading: { fill: i % 2 === 0 ? LGRAY : WHITE, type: ShadingType.CLEAR }, borders: aNB(), margins: { top: 100, bottom: 100, left: 140, right: 120 },
        children: [para(txt(value, { size: 20 }))] }),
    ] })),
  }))

  // ── YOUR INPUT MATTERS MOST ────────────────────────────────────────────────
  children.push(spacer(200), sectionHeader('Your Input Matters Most', TEAL), spacer(80))
  children.push(para(txt('Before we share what we identified, we want to hear from you first.', { bold: true, color: NAVY, size: 22 }), { after: 120 }))
  children.push(para(txt("Every business is unique — and the most effective AI deployment always starts with a clear understanding of what matters most to the people running the operation. That's you.", { size: 22 }), { after: 120 }))
  children.push(para(txt("We'd like to open our conversation with one simple question:", { size: 22 }), { after: 120 }))
  children.push(new Table({
    width: { size: CW, type: WidthType.DXA }, columnWidths: [CW],
    borders: aB(TEAL),
    rows: [new TableRow({ children: [new TableCell({
      width: { size: CW, type: WidthType.DXA }, shading: { fill: 'E8F8F5', type: ShadingType.CLEAR },
      borders: aNB(), margins: { top: 200, bottom: 200, left: 280, right: 280 },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 80 }, children: [new TextRun({ text: '“What is the one area of your business that consumes the most time,', font: 'Arial', size: 23, italics: true, color: TEAL })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 80 }, children: [new TextRun({ text: 'costs the most money, or that you simply dread having to deal with?”', font: 'Arial', size: 23, italics: true, color: TEAL })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 40, after: 0 }, children: [new TextRun({ text: 'Your answer becomes the starting point for everything we do together.', font: 'Arial', size: 21, color: DGRAY, italics: true })] }),
      ],
    })] })],
  }))
  children.push(spacer(120))
  children.push(para(txt("There are no wrong answers — and no obligation beyond the conversation. If nothing comes to mind immediately, that's completely fine. We've done our own assessment below based on your business profile, and we're happy to use that as a starting point.", { size: 22 }), { after: 0 }))

  // ── CHALLENGES WE IDENTIFIED ───────────────────────────────────────────────
  if (company.keyPainPoints.length > 0) {
    children.push(spacer(200), sectionHeader('The Challenges We Identified', NAVY), spacer(80))
    children.push(para(txt(`During our assessment of ${shortName}, these operational challenges stood out as both significant and highly solvable with the right AI agents:`, { size: 22 }), { after: 140 }))
    children.push(new Table({
      width: { size: CW, type: WidthType.DXA }, columnWidths: [CW],
      borders: aB(BLUE),
      rows: [new TableRow({ children: [new TableCell({
        width: { size: CW, type: WidthType.DXA }, shading: { fill: 'EBF5FB', type: ShadingType.CLEAR },
        borders: aNB(), margins: { top: 180, bottom: 180, left: 240, right: 240 },
        children: company.keyPainPoints.map((pt, i) =>
          para(txt(`${i + 1}.  ${pt}`, { bold: i === 0, color: i === 0 ? NAVY : DGRAY, size: i === 0 ? 22 : 21 }), { after: i < company.keyPainPoints.length - 1 ? 80 : 0 })
        ),
      })] })],
    }))
  }

  // ── PRIMARY AGENT 1 ────────────────────────────────────────────────────────
  if (primaryAgents[0]) {
    const a = primaryAgents[0]
    children.push(spacer(200), sectionHeader('Our Top Recommendation', NAVY), spacer(80))
    children.push(para(txt('Based on our assessment, this agent addresses your most significant automation opportunity:', { size: 22 }), { after: 160 }))
    children.push(primaryAgentCard(a.rank, a.name, a.tagline, shortName, a.whyThisCompany, a.description, a.impact))
  }

  // ── PRIMARY AGENT 2 ────────────────────────────────────────────────────────
  if (primaryAgents[1]) {
    const a = primaryAgents[1]
    children.push(spacer(200), sectionHeader('Bonus Opportunity — While We’re At It', TEAL), spacer(80))
    children.push(para(txt('One additional high-impact agent came up during our assessment that creates immediate, compounding value:', { size: 22 }), { after: 160 }))
    children.push(primaryAgentCard(a.rank, a.name, a.tagline, shortName, a.whyThisCompany, a.description, a.impact))
  }

  // ── EXPANSION AGENTS ────────────────────────────────────────────────────────
  if (expansionAgents.length > 0) {
    children.push(spacer(200), sectionHeader('Your Growth Path — Scaling with Agents', NAVY), spacer(80))
    children.push(para(txt(`Once you experience the impact of your first agent, the next steps become obvious. Here is a natural scale path designed specifically for ${shortName}:`, { size: 22 }), { after: 160 }))
    children.push(new Table({
      width: { size: CW, type: WidthType.DXA },
      columnWidths: [400, 2300, CW - 2700],
      borders: aB(MGRAY),
      rows: [
        new TableRow({ children: [new TableCell({
          columnSpan: 3, width: { size: CW, type: WidthType.DXA },
          shading: { fill: TEAL, type: ShadingType.CLEAR }, borders: aNB(), margins: { top: 100, bottom: 100, left: 140, right: 140 },
          children: [para(txt('Recommended Scale Path', { bold: true, color: WHITE, size: 21, caps: true }))],
        })] }),
        ...expansionAgents.map(a => expansionRow(a.rank, a.category, a.name, a.description)),
      ],
    }))
    children.push(spacer(160))
    children.push(para(txt('With nearly 8,000 agent options available to address specific business needs, the opportunities for operational transformation are vast. As needs are identified and validated, we can continue to optimize your operations for maximum benefit.', { size: 22, color: NAVY }), { after: 120 }))
    children.push(para(txt("Every agent you add increases the return on the ones before it. At a certain point, the question shifts from 'which agent next?' to 'what becomes possible when they all work together?'", { size: 22, italic: true, color: NAVY }), { after: 0 }))
  }

  // ── THE BIGGER PICTURE ──────────────────────────────────────────────────────
  children.push(spacer(200), sectionHeader('The Bigger Picture — Where This Journey Leads', NAVY), spacer(80))
  children.push(para(txt('As you experience results and your confidence in AI grows, a full Astra AI MIND deployment becomes a natural and compelling next conversation. A full MIND deployment connects every agent, every workflow, and every data source across your organization into a single intelligent platform — optimizing operations, ensuring data compliance, and enabling the kind of compounding efficiency gains that grow more valuable every single day.'), { after: 140 }))
  children.push(para(txt("Unlike traditional SaaS software — where you rent access and remain dependent on a vendor's pricing decisions and policies — both your standalone agents and the full MIND platform are owned infrastructure. Your AI. Your data. Your competitive advantage. No vendor lock-in.", { size: 22 }), { after: 140 }))
  children.push(para(txt('All at a fraction of what traditional enterprise AI solutions typically cost.', { size: 22, bold: true, color: BLUE }), { after: 140 }))
  children.push(para(txt("Once you've validated your first agent's performance, we can discuss options to further advance your AI momentum. That conversation happens when you're ready — and not a moment before. Your first agent is simply the door.", { size: 22, italic: true, color: NAVY }), { after: 0 }))

  // ── CTA BOX ─────────────────────────────────────────────────────────────────
  children.push(spacer(200), new Table({
    width: { size: CW, type: WidthType.DXA }, columnWidths: [CW],
    borders: aB(GOLD),
    rows: [new TableRow({ children: [new TableCell({
      width: { size: CW, type: WidthType.DXA }, shading: { fill: 'FDFEFE', type: ShadingType.CLEAR },
      borders: aNB(), margins: { top: 240, bottom: 240, left: 280, right: 280 },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 120 }, children: [new TextRun({ text: 'Ready to See It In Action?', font: 'Arial', size: 28, bold: true, color: NAVY })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 140 }, children: [new TextRun({ text: "The best way to evaluate any of these agents is a 30-minute AI Readiness Call — no pressure, no commitment. We'll walk through exactly how the recommended agent would work inside your specific operation, answer your questions honestly, and let the value speak for itself.", font: 'Arial', size: 21, color: DGRAY })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 140 }, children: [new TextRun({ text: "The firms that move first in their market don't necessarily have bigger budgets. They just make one smart decision sooner than their competitors.", font: 'Arial', size: 21, bold: true, color: BLUE, italics: true })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 80 }, children: [new TextRun({ text: 'Book your complimentary 30-minute AI Readiness Call today:', font: 'Arial', size: 21, color: DGRAY })] }),
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

  // ── FOOTER NOTE ─────────────────────────────────────────────────────────────
  children.push(spacer(160), rule(LGRAY, 80, 80))
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0 },
    children: [new TextRun({ text: `This Agentic Impact Assessment was prepared by Astra AI exclusively for ${shortName} | ${location} | theastraway.com | Confidential — Not for Distribution`, font: 'Arial', size: 16, color: FTNOTE, italics: true })],
  }))

  // ── ABOUT ASTRA AI ──────────────────────────────────────────────────────────
  children.push(spacer(180), new Table({
    width: { size: CW, type: WidthType.DXA }, columnWidths: [CW],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    borders: { top: nb(), bottom: nb(), left: nb(), right: nb(), insideH: nb(), insideV: nb() } as any,
    rows: [new TableRow({ children: [new TableCell({
      width: { size: CW, type: WidthType.DXA }, shading: { fill: NAVY, type: ShadingType.CLEAR },
      borders: aNB(), margins: { top: 140, bottom: 140, left: 280, right: 280 }, verticalAlign: VerticalAlign.TOP,
      children: [
        new Paragraph({ spacing: { before: 0, after: 30 }, children: [new TextRun({ text: 'ABOUT ASTRA AI', font: 'Arial', size: 26, bold: true, color: WHITE, allCaps: true })] }),
        new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: 'New York | AI Consulting & Enterprise Intelligence | theastraway.com', font: 'Arial', size: 18, color: 'A9CCE3', italics: true })] }),
      ],
    })] })],
  }))
  children.push(spacer(120))

  if (graphBuffer) {
    children.push(new Paragraph({
      spacing: { before: 0, after: 0 },
      children: [new ImageRun({
        data: graphBuffer,
        transformation: { width: 190, height: 200 },
        type: 'jpg',
        floating: {
          horizontalPosition: { relative: HorizontalPositionRelativeFrom.COLUMN, align: HorizontalPositionAlign.RIGHT },
          verticalPosition: { relative: VerticalPositionRelativeFrom.PARAGRAPH, offset: 152400 },
          wrap: { type: TextWrappingType.SQUARE, side: TextWrappingSide.LEFT },
          margins: { top: 0, bottom: 114400, left: 114400, right: 0 },
          allowOverlap: false,
        },
        altText: { title: 'MIND Knowledge Graph', description: 'Astra AI knowledge graph visualization', name: 'knowledge-graph' },
      })],
    }))
  }

  children.push(
    new Paragraph({ spacing: { before: 0, after: 140 }, children: [new TextRun({ text: 'Astra AI is a New York-based AI consulting firm serving businesses of every size — from ambitious local and regional companies to large-scale U.S. and global enterprise organizations. We design, build, and operate the AI infrastructure that defines what a business becomes in the decade ahead.', font: 'Arial', size: 20, color: DGRAY })] }),
    new Paragraph({ spacing: { before: 0, after: 140 }, children: [new TextRun({ text: '“Astra AI was founded on the conviction that the companies that win the next decade will not buy intelligence off the shelf — they will install it, deliberately, at the right depth, with a partner who understands the business as well as the technology. That is the work we do.”', font: 'Arial', size: 20, italics: true, color: BLUE })] }),
    new Paragraph({ spacing: { before: 0, after: 140 }, children: [
      new TextRun({ text: 'At the heart of every Astra AI engagement is ', font: 'Arial', size: 20, color: DGRAY }),
      new TextRun({ text: 'MIND', font: 'Arial', size: 20, bold: true, color: NAVY }),
      new TextRun({ text: ' — a proprietary Knowledge Graph RAG platform built so systems do not forget what matters about a business. MIND is the persistent memory and context layer that remembers the people, decisions, constraints, and history that define a company. ', font: 'Arial', size: 20, color: DGRAY }),
      new TextRun({ text: 'It belongs to the client. It travels with their business.', font: 'Arial', size: 20, bold: true, color: DGRAY }),
    ] }),
    new Paragraph({ spacing: { before: 0, after: 0 }, children: [
      new TextRun({ text: 'From a single agent solving one specific problem, to a full enterprise deployment transforming how an entire organization thinks and operates — ', font: 'Arial', size: 20, color: DGRAY }),
      new TextRun({ text: 'Astra AI meets you where you are. And builds toward where you want to go.', font: 'Arial', size: 20, bold: true, color: NAVY }),
    ] }),
    spacer(80),
    rule(LGRAY, 60, 60),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0 }, children: [new TextRun({ text: 'Astra AI | theastraway.com | For companies that intend to move first.', font: 'Arial', size: 16, color: FTNOTE, italics: true })] })
  )

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
      'Content-Disposition': `attachment; filename="AIA_${safeName}.docx"`,
    },
  })
}
