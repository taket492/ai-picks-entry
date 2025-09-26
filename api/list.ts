import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '@vercel/postgres'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' })
  try {
    await sql`CREATE TABLE IF NOT EXISTS entries (
      id text PRIMARY KEY,
      payload jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`

    const { rows } = await sql`
      SELECT 
        id,
        updated_at,
        COALESCE((payload->'meta'->>'race_date'), (payload->'races'->0->'info'->>'race_date'), '') AS race_date,
        COALESCE((payload->'meta'->>'course_name'), (payload->'races'->0->'info'->>'course_name'), '') AS course_name,
        COALESCE((payload->'meta'->>'course_code'), (payload->'races'->0->'info'->>'course_code'), '') AS course_code
      FROM entries
      ORDER BY updated_at DESC
      LIMIT 30
    `

    res.status(200).json({ items: rows })
  } catch (e: any) {
    console.error(e)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
