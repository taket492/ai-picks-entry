import React, { useEffect, useMemo, useRef, useState } from 'react'
import RaceInfoForm from './components/RaceInfoForm'
import HorseTable from './components/HorseTable'
import SummaryPane from './components/SummaryPane'
import PredictorsSettings from './components/PredictorsSettings'
import GlobalBest from './components/GlobalBest'
import type { RaceInfo, Row, RaceData, Predictor, PredictorId } from './types'
import { apiList, apiLoad, apiNew, apiSave, type ListItem } from './utils/api'
import MeetingControls from './components/MeetingControls'

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
  const [recent, setRecent] = useState<ListItem[]>([])
  const [meeting, setMeeting] = useState<{ race_date?: string; course_code?: string; course_name?: string }>({})
  const [meetingChangeInPlaceOnce, setMeetingChangeInPlaceOnce] = useState<boolean>(false)

  const race = races.find(r => r.race_no === current)!
  const setRaceRows = (rows: Row[]) => {
    setRaces(prev => prev.map(r => r.race_no === current ? { ...r, rows } : r))
  }
  const setRaceInfo = (info: Partial<RaceInfo>) => {
    setRaces(prev => prev.map(r => r.race_no === current ? { ...r, info } : r))
  }
  const predictorsIds: PredictorId[] = ['A','B','C','D']

  // Helpers
  const applyMeetingInfo = (info: Partial<RaceInfo>) => {
    setMeeting(prev => ({ ...prev, ...info }))
    setRaces(prev => prev.map(r => ({ ...r, info: { ...r.info, ...info } })))
  }

  const switchToId = async (id: string) => {
    try {
      const data = await apiLoad(id)
      if (data.predictors) setPredictors(data.predictors)
      if (data.races) setRaces(data.races)
      if ((data as any).meta) setMeeting((data as any).meta)
      else if (data.races && data.races[0] && data.races[0].info) setMeeting({
        race_date: data.races[0].info.race_date,
        course_code: data.races[0].info.course_code,
        course_name: data.races[0].info.course_name,
      })
      setDocId(id)
      const url = new URL(window.location.href)
      url.searchParams.set('id', id)
      window.history.replaceState({}, '', url.toString())
      localStorage.setItem('lastDocId', id)
    } catch {
      // ignore
    }
  }

  const createNewMeeting = async (): Promise<string | null> => {
    try {
      const { id: newId } = await apiNew()
      setPredictors([
        { id: 'A', name: '予想家A', weight: 1.0 },
        { id: 'B', name: '予想家B', weight: 1.0 },
        { id: 'C', name: '予想家C', weight: 1.0 },
        { id: 'D', name: '予想家D', weight: 1.0 },
      ])
      setRaces(Array.from({ length: 12 }).map((_, i) => makeInitialRace(i + 1)))
      setCurrent(1)
      setMeeting({})
      setDocId(newId)
      const url = new URL(window.location.href)
      url.searchParams.set('id', newId)
      window.history.replaceState({}, '', url.toString())
      localStorage.setItem('lastDocId', newId)
      return newId
    } catch {
      return null
    }
  }

  const handleMeetingChange = async (info: Partial<RaceInfo>) => {
    if (meetingChangeInPlaceOnce) {
      setMeetingChangeInPlaceOnce(false)
      applyMeetingInfo(info)
      return
    }
    // Detect change of key meeting fields: date or course
    const currentDate = meeting.race_date || ''
    const currentCourse = meeting.course_code || ''
    const nextDate = info.race_date ?? currentDate
    const nextCourse = info.course_code ?? currentCourse

    const isChangingMeeting = (currentDate && nextDate && nextDate !== currentDate) || (currentCourse && nextCourse && nextCourse !== currentCourse)

    if (docId && isChangingMeeting) {
      // If an existing doc for same date+course exists, switch to it instead of creating
      const target = recent.find(it => (it.race_date || '') === (nextDate || '') && ((it.course_code || '') === (nextCourse || '') || (it.course_name || '') === (info.course_name || '')))
      if (target && target.id !== docId) {
        await switchToId(target.id)
        // After switching, ensure meeting state reflects the selected info
        applyMeetingInfo(info)
      } else {
        const newId = await createNewMeeting()
        if (newId) {
          applyMeetingInfo(info)
        }
      }
    } else {
      applyMeetingInfo(info)
    }
  }

  const duplicateAsNewMeeting = async () => {
    try {
      const { id: newId } = await apiNew()
      setDocId(newId)
      const url = new URL(window.location.href)
      url.searchParams.set('id', newId)
      window.history.replaceState({}, '', url.toString())
      localStorage.setItem('lastDocId', newId)
      // Allow next meeting change (date/course) to modify this cloned doc in place
      setMeetingChangeInPlaceOnce(true)
      // Optionally refresh recents after autosave occurs
      setTimeout(async () => {
        try { const items = await apiList(); setRecent(items) } catch {}
      }, 1500)
    } catch {}
  }

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
          if ((data as any).meta) setMeeting((data as any).meta)
          else if (data.races && data.races[0] && data.races[0].info) setMeeting({
            race_date: data.races[0].info.race_date,
            course_code: data.races[0].info.course_code,
            course_name: data.races[0].info.course_name,
          })
          setDocId(id)
          localStorage.setItem('lastDocId', id)
          return
        } catch {
          // fallthrough to new
        }
      }
      // Try lastDocId from localStorage
      const last = localStorage.getItem('lastDocId')
      if (last) {
        try {
          const data = await apiLoad(last)
          if (data.predictors) setPredictors(data.predictors)
          if (data.races) setRaces(data.races)
          if ((data as any).meta) setMeeting((data as any).meta)
          else if (data.races && data.races[0] && data.races[0].info) setMeeting({
            race_date: data.races[0].info.race_date,
            course_code: data.races[0].info.course_code,
            course_name: data.races[0].info.course_name,
          })
          setDocId(last)
          url.searchParams.set('id', last)
          window.history.replaceState({}, '', url.toString())
          return
        } catch {}
      }
      try {
        const { id: newId } = await apiNew()
        setDocId(newId)
        url.searchParams.set('id', newId)
        window.history.replaceState({}, '', url.toString())
        localStorage.setItem('lastDocId', newId)
      } catch {
        // offline/local without id
      }
    })()
  }, [])

  // Load recent list
  useEffect(() => {
    (async () => {
      try {
        const items = await apiList()
        setRecent(items)
      } catch {}
    })()
  }, [])

  // Auto save (debounced)
  const snapshot = useMemo(() => ({ predictors, races, meta: meeting }), [predictors, races, meeting])
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-lg font-semibold">AI予想屋の印 — 1〜12R・4予想家</h1>
            <div className="flex flex-col items-end gap-2">
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
              <div className="flex items-center gap-2">
                <button className="btn btn-secondary" onClick={createNewMeeting}>新しい開催を作成</button>
                <button className="btn btn-secondary" onClick={duplicateAsNewMeeting}>別開催として複製</button>
                <select className="input" value="" onChange={e => { const id = e.target.value; if (id) switchToId(id) }}>
                  <option value="">最近の保存から開く</option>
                  {recent.map(it => (
                    <option key={it.id} value={it.id}>
                      {(it.race_date || '日付未設定')} {it.course_name ? `・${it.course_name}` : ''}（{it.id}）
                    </option>
                  ))}
                </select>
              </div>
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
              <h2 className="mb-3 text-base font-semibold">開催情報（全レース共通）</h2>
              <MeetingControls value={{
                race_date: meeting.race_date || '',
                course_code: meeting.course_code || '',
                course_name: meeting.course_name || '',
              }} onChange={handleMeetingChange} />
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
