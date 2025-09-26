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
  return (data.items || []) as ListItem[]
}
