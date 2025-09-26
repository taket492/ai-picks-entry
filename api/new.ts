import type { VercelRequest, VercelResponse } from '@vercel/node'
import { randomUUID } from 'node:crypto'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })
  // 短いIDを生成（8文字のslug）
  const uuid = randomUUID().replace(/-/g, '')
  const id = uuid.slice(0, 8)
  res.status(200).json({ id })
}

