import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '@vercel/postgres'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })
  try {
    const { id, payload } = req.body || {}
    if (!id || !payload) return res.status(400).json({ error: 'id and payload are required' })

    await sql`CREATE TABLE IF NOT EXISTS entries (
      id text PRIMARY KEY,
      payload jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`

    await sql`INSERT INTO entries (id, payload)
      VALUES (${id}, ${payload}::jsonb)
      ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = now()`

    res.status(200).json({ ok: true })
  } catch (e: any) {
    console.error(e)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}

