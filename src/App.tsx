import React, { useEffect, useMemo, useRef, useState } from 'react'
import RaceInfoForm from './components/RaceInfoForm'
import HorseTable from './components/HorseTable'
import SummaryPane from './components/SummaryPane'
import PredictorsSettings from './components/PredictorsSettings'
import GlobalBest from './components/GlobalBest'
import type { RaceInfo, Row, RaceData, Predictor, PredictorId } from './types'
import { apiLoad, apiNew, apiSave } from './utils/api'

function makeEmptyRow(i: number): Row {
  return { horse_no: String(i + 1), horse_name: '', marks: { A: '', B: '', C: '', D: '' }, comment: '' }
}

function makeInitialRace(no: number): RaceData {
  return {
    race_no: no,
    info: { race_no: String(no) },
    rows: Array.from({ length: 5 }).map((_, i) => makeEmptyRow(i)),
  }
}

export default function App() {
  const [predictors, setPredictors] = useState<Predictor[]>([
    { id: 'A', name: '予想家A', weight: 1.0 },
    { id: 'B', name: '予想家B', weight: 1.0 },
    { id: 'C', name: '予想家C', weight: 1.0 },
    { id: 'D', name: '予想家D', weight: 1.0 },
  ])
  const [races, setRaces] = useState<RaceData[]>(Array.from({ length: 12 }).map((_, i) => makeInitialRace(i + 1)))
  const [current, setCurrent] = useState<number>(1)
  const [docId, setDocId] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)

  const race = races.find(r => r.race_no === current)!
  const setRaceRows = (rows: Row[]) => {
    setRaces(prev => prev.map(r => r.race_no === current ? { ...r, rows } : r))
  }
  const setRaceInfo = (info: Partial<RaceInfo>) => {
    setRaces(prev => prev.map(r => r.race_no === current ? { ...r, info } : r))
  }
  const predictorsIds: PredictorId[] = ['A','B','C','D']

  // Load or create doc id
  useEffect(() => {
    (async () => {
      const url = new URL(window.location.href)
      const id = url.searchParams.get('id')
      if (id) {
        try {
          const data = await apiLoad(id)
          if (data.predictors) setPredictors(data.predictors)
          if (data.races) setRaces(data.races)
          setDocId(id)
          return
        } catch {
          // fallthrough to new
        }
      }
      try {
        const { id: newId } = await apiNew()
        setDocId(newId)
        url.searchParams.set('id', newId)
        window.history.replaceState({}, '', url.toString())
      } catch {
        // offline/local without id
      }
    })()
  }, [])

  // Auto save (debounced)
  const snapshot = useMemo(() => ({ predictors, races }), [predictors, races])
  const snapStr = useMemo(() => JSON.stringify(snapshot), [snapshot])
  const timerRef = useRef<number | null>(null)
  useEffect(() => {
    if (!docId) return
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(async () => {
      setIsSaving(true)
      try {
        await apiSave(docId, snapshot)
        setLastSavedAt(Date.now())
      } finally {
        setIsSaving(false)
      }
    }, 600)
    return () => { if (timerRef.current) window.clearTimeout(timerRef.current) }
  }, [docId, snapStr])

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">AI予想屋の印 — 1〜12R・4予想家</h1>
            <div className="text-xs text-gray-600">
              {docId ? (
                <span>
                  ID: <span className="font-mono">{docId}</span>{' '}
                  {isSaving ? '保存中…' : lastSavedAt ? `保存済み ${new Date(lastSavedAt).toLocaleTimeString()}` : ''}
                </span>
              ) : (
                <span>ローカル編集（ID未発行）</span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <aside className="space-y-4 lg:col-span-1">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="mb-3 text-base font-semibold">レース切替</h2>
              <div className="grid grid-cols-6 gap-2">
                {races.map(r => (
                  <button key={r.race_no} className={`btn ${current === r.race_no ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setCurrent(r.race_no)}>R{r.race_no}</button>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="mb-3 text-base font-semibold">予想家設定</h2>
              <PredictorsSettings predictors={predictors} onChange={setPredictors} />
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <GlobalBest races={races} predictors={predictors} />
            </div>
          </aside>

          <section className="space-y-6 lg:col-span-2">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="mb-3 text-base font-semibold">レース情報</h2>
              <RaceInfoForm value={{
                race_date: race.info.race_date || '',
                course_code: race.info.course_code || '',
                course_name: race.info.course_name || '',
                race_no: String(race.race_no),
                race_name: race.info.race_name || '',
              }} onChange={v => setRaceInfo(v)} />
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <HorseTable rows={race.rows} onChange={setRaceRows} predictors={predictorsIds} />
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <SummaryPane rows={race.rows} predictors={predictors} />
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
