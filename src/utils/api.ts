import type { Predictor, RaceData } from '../types'

export interface Payload {
  predictors: Predictor[]
  races: RaceData[]
  meta?: {
    race_date?: string
    course_code?: string
    course_name?: string
  }
}

export interface ListItem {
  id: string
  race_date?: string
  course_name?: string
  course_code?: string
  updated_at?: string
}

export async function apiNew(): Promise<{ id: string }> {
  const r = await fetch('/api/new', { method: 'POST' })
  if (!r.ok) throw new Error('failed to create id')
  return r.json()
}

export async function apiSave(id: string, payload: Payload): Promise<void> {
  const r = await fetch('/api/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, payload }),
  })
  if (!r.ok) throw new Error('save failed')
}

export async function apiLoad(id: string): Promise<Payload> {
  const r = await fetch(`/api/load?id=${encodeURIComponent(id)}`)
  if (!r.ok) throw new Error('load failed')
  const data = await r.json()
  return data.payload as Payload
}

export async function apiList(): Promise<ListItem[]> {
  const r = await fetch('/api/list')
  if (!r.ok) throw new Error('list failed')
  const data = await r.json()
  const items = (data.items || []) as ListItem[]
  // Fallback filtering: exclude entries without a date
  return items.filter(it => (it.race_date || '').trim() !== '')
}

export interface FetchCardHorse {
  horse_no: string
  horse_name: string
}

export interface FetchCardRace {
  race_no: number
  horses: FetchCardHorse[]
}

export interface FetchCardResponse {
  races: FetchCardRace[]
}

export async function apiFetchCard(params: { date: string; course: string }): Promise<FetchCardResponse> {
  const qs = new URLSearchParams({ date: params.date, course: params.course })
  try {
    const r = await fetch(`/api/fetch-card?${qs.toString()}`)
    if (!r.ok) throw new Error('fetch-card failed')
    return await r.json()
  } catch (_) {
    // Dev fallback: return mock locally when serverless is unavailable
    const races: FetchCardRace[] = Array.from({ length: 12 }).map((_, i) => ({
      race_no: i + 1,
      horses: Array.from({ length: 8 }).map((__, j) => ({
        horse_no: String(j + 1),
        horse_name: `サンプル${i + 1}-${j + 1}`,
      })),
    }))
    return { races }
  }
}
