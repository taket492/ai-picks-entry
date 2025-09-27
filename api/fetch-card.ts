import type { VercelRequest, VercelResponse } from '@vercel/node'

interface Horse { horse_no: string; horse_name: string }
interface Race { race_no: number; horses: Horse[] }

function buildMock(date: string, course: string): { races: Race[] } {
  const races: Race[] = Array.from({ length: 12 }).map((_, i) => ({
    race_no: i + 1,
    horses: Array.from({ length: 8 }).map((__, j) => ({
      horse_no: String(j + 1),
      horse_name: `サンプル${i + 1}-${j + 1}`,
    })),
  }))
  return { races }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' })
  const date = String(req.query.date || '')
  const course = String(req.query.course || '')
  if (!date || !course) return res.status(400).json({ error: 'date and course are required' })

  // If an upstream provider is configured, proxy the request and expect a
  // normalized JSON payload: { races: [{ race_no, horses: [{ horse_no, horse_name }] }] }
  const base = process.env.CARD_PROVIDER_URL
  if (base) {
    try {
      const url = new URL(base)
      url.searchParams.set('date', date)
      url.searchParams.set('course', course)
      const headers: Record<string, string> = {}
      const authHeader = process.env.CARD_PROVIDER_AUTH_HEADER
      const authValue = process.env.CARD_PROVIDER_AUTH_VALUE
      if (authHeader && authValue) headers[authHeader] = authValue
      const r = await fetch(url.toString(), { headers })
      if (!r.ok) throw new Error(`upstream failed: ${r.status}`)
      const payload = await r.json()
      // Basic validation
      if (!payload || !Array.isArray(payload.races)) throw new Error('invalid payload')
      return res.status(200).json(payload)
    } catch (e) {
      console.error('fetch-card upstream error', e)
      // Fall through to mock to avoid breaking UX in dev
    }
  }

  // Placeholder: mock data for development
  const payload = buildMock(date, course)
  return res.status(200).json(payload)
}
