import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '@vercel/postgres'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' })
  try {
    const id = (req.query.id as string) || ''
    if (!id) return res.status(400).json({ error: 'id is required' })
    await sql`CREATE TABLE IF NOT EXISTS entries (
      id text PRIMARY KEY,
      payload jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`
    const { rows } = await sql`SELECT payload FROM entries WHERE id = ${id}`
    if (rows.length === 0) return res.status(404).json({ error: 'not found' })
    res.status(200).json({ id, payload: rows[0].payload })
  } catch (e: any) {
    console.error(e)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}

