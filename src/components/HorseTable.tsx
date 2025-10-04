import React from 'react'
import type { Row, Mark, PredictorId } from '../types'
import { ALL_MARKS, countStars } from '../utils/marks'

interface Props {
  rows: Row[]
  onChange: (rows: Row[]) => void
  predictors: PredictorId[]
}

export default function HorseTable({ rows, onChange, predictors }: Props) {
  function updateRow(idx: number, patch: Partial<Row>) {
    const next = [...rows]
    next[idx] = { ...next[idx], ...patch, updated_at: new Date().toISOString() }
    onChange(next)
  }
  function addRow() {
    const nextNo = String(Math.max(0, ...rows.map(r => Number(r.horse_no) || 0)) + 1)
    onChange([
      ...rows,
      { horse_no: nextNo, horse_name: '', marks: { A: '', B: '', C: '', D: '' }, comment: '' },
    ])
  }
  function deleteRow(idx: number) {
    const next = rows.filter((_, i) => i !== idx)
    onChange(next)
  }
  function cycleMark(m: Mark): Mark {
    const i = ALL_MARKS.indexOf(m)
    return ALL_MARKS[(i + 1) % ALL_MARKS.length]
  }
  function clearMarks(idx: number) {
    const empty = Object.fromEntries(predictors.map(p => [p, ''])) as Row['marks']
    updateRow(idx, { marks: empty })
  }
  function copyFromPrev(idx: number) {
    if (idx <= 0) return
    const prev = rows[idx - 1]
    if (!prev) return
    updateRow(idx, { marks: { ...prev.marks } })
  }
  function bulkSet(id: PredictorId, mark: Mark) {
    const next = rows.map(r => ({ ...r, marks: { ...r.marks, [id]: mark } }))
    onChange(next)
  }
  function bulkClearAll() {
    const next = rows.map(r => ({ ...r, marks: Object.fromEntries(predictors.map(p => [p, ''])) as Row['marks'] }))
    onChange(next)
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-700">馬ごとの入力</h3>
        <div className="hidden md:flex items-center gap-2">
          <button className="btn btn-secondary" onClick={addRow}>行を追加</button>
          <button className="btn btn-secondary" onClick={bulkClearAll}>全印クリア</button>
        </div>
      </div>
      {/* Desktop/Tablets: table */}
      <div className="overflow-auto border border-gray-200 rounded-md hidden md:block">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-700 sticky top-0 z-10">
            <tr>
              <th className="px-2 py-2 text-left sticky left-0 z-10 bg-gray-50">馬番</th>
              <th className="px-2 py-2 text-left sticky left-16 z-10 bg-gray-50">馬名</th>
              {predictors.map(p => (
                <th key={p} className="px-2 py-2 text-left">
                  <div className="flex items-center gap-2">
                    <span>{p}</span>
                    <button
                      className="px-1.5 py-0.5 text-[11px] rounded ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                      title="この列を全て◎にする"
                      onClick={() => bulkSet(p, '◎' as Mark)}
                    >全◎</button>
                    <button
                      className="px-1.5 py-0.5 text-[11px] rounded ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                      title="この列を全てクリア"
                      onClick={() => bulkSet(p, '' as Mark)}
                    >クリア</button>
                  </div>
                </th>
              ))}
              <th className="px-2 py-2 text-left">メモ</th>
              <th className="px-2 py-2 w-28 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r, idx) => {
              const stars = countStars(r)
              const tone = stars >= 3 ? 'bg-indigo-50' : stars >= 2 ? 'bg-indigo-25' : 'bg-white'
              const border = stars >= 4 ? 'border-l-4 border-indigo-500' : stars === 3 ? 'border-l-4 border-indigo-400' : stars === 2 ? 'border-l-4 border-indigo-300' : ''
              return (
              <tr key={idx} className={`${tone} hover:bg-gray-50 ${border}`}>
                <td className="px-2 py-1 w-16 sticky left-0 bg-white z-10">
                  <input inputMode="numeric" pattern="[0-9]*" className="table-input text-center" value={r.horse_no} onChange={e => updateRow(idx, { horse_no: e.target.value })} />
                </td>
                <td className="px-2 py-1 min-w-[12rem] sticky left-16 bg-white z-10">
                  <input className="table-input" value={r.horse_name} onChange={e => updateRow(idx, { horse_name: e.target.value })} />
                </td>
                {predictors.map(p => (
                  <td key={p} className="px-2 py-1 w-20">
                    <button
                      className={`w-full px-2 py-1 text-xs rounded-md ring-1 ring-inset ${r.marks[p] ? 'bg-indigo-600 text-white ring-indigo-600' : 'bg-white text-gray-900 ring-gray-300'}`}
                      onClick={() => {
                        const nextMark = cycleMark(r.marks[p] as Mark)
                        const marks = { ...r.marks, [p]: nextMark }
                        updateRow(idx, { marks })
                      }}
                      title="クリックで印を切り替え"
                    >
                      {r.marks[p] || '—'}
                    </button>
                  </td>
                ))}
                <td className="px-2 py-1 min-w-[10rem]">
                  <input className="table-input" value={r.comment ?? ''} onChange={e => updateRow(idx, { comment: e.target.value })} />
                </td>
                <td className="px-2 py-1 w-28 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {idx > 0 ? (
                      <button className="text-xs text-gray-700 hover:underline" onClick={() => copyFromPrev(idx)} title="上の印をコピー">コピー</button>
                    ) : null}
                    <button className="text-xs text-red-600 hover:underline" onClick={() => deleteRow(idx)}>削除</button>
                  </div>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
      {/* Mobile: cards */}
      <div className="md:hidden space-y-3">
        {rows.map((r, idx) => {
          const mobileStars = countStars(r)
          return (
          <div key={idx} className="rounded-md border border-gray-200 bg-white p-3 shadow-sm">
            <div className="flex items-center gap-2 mb-2 min-w-0">
              <input inputMode="numeric" pattern="[0-9]*" className="input w-16 text-center" placeholder="#" value={r.horse_no} onChange={e => updateRow(idx, { horse_no: e.target.value })} />
              <input className="input flex-1 min-w-0" placeholder="馬名" aria-label="馬名" value={r.horse_name} onChange={e => updateRow(idx, { horse_name: e.target.value })} />
              <span className="ml-1 shrink-0 inline-flex items-center rounded-full bg-indigo-50 px-2 py-1 text-[11px] font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200">◎{mobileStars}</span>
            </div>
            {/* Predictors as large tap targets: tap to cycle mark */}
            <div className="grid grid-cols-2 gap-2">
              {predictors.map(p => (
                <button
                  key={p}
                  className={`w-full flex items-center justify-between rounded-md px-3 py-2 text-sm ring-1 ring-inset transition-colors ${r.marks[p] ? 'bg-indigo-600 text-white ring-indigo-600' : 'bg-white text-gray-900 ring-gray-300'}`}
                  onClick={() => {
                    const next = cycleMark(r.marks[p] as Mark)
                    updateRow(idx, { marks: { ...r.marks, [p]: next } })
                  }}
                  aria-label={`予想家${p}の印を切り替え`}
                  title="タップで印を切り替え"
                >
                  <span className="font-medium">{p}</span>
                  <span className="ml-3 text-base leading-none">{r.marks[p] || '—'}</span>
                </button>
              ))}
            </div>
            <div className="mt-3">
              <input className="input" placeholder="メモ" value={r.comment ?? ''} onChange={e => updateRow(idx, { comment: e.target.value })} />
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button className="text-xs text-gray-700 underline" onClick={() => clearMarks(idx)}>印クリア</button>
                {idx > 0 ? (
                  <button className="text-xs text-gray-700 underline" onClick={() => copyFromPrev(idx)}>上の印をコピー</button>
                ) : null}
              </div>
              <button className="text-xs text-red-600" onClick={() => deleteRow(idx)}>削除</button>
            </div>
          </div>
        )})}
        <div className="pt-1">
          <button className="btn btn-primary w-full" onClick={addRow}>行を追加</button>
        </div>
      </div>
    </div>
  )
}
