import React from 'react'
import type { Row, Mark, PredictorId } from '../types'
import { ALL_MARKS } from '../utils/marks'

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
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-700">馬ごとの入力</h3>
        <button className="btn btn-secondary hidden md:inline-flex" onClick={addRow}>行を追加</button>
      </div>
      {/* Desktop/Tablets: table */}
      <div className="overflow-auto border border-gray-200 rounded-md hidden md:block">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="px-2 py-2 text-left">馬番</th>
              <th className="px-2 py-2 text-left">馬名</th>
              {predictors.map(p => (
                <th key={p} className="px-2 py-2 text-left">{p}</th>
              ))}
              <th className="px-2 py-2 text-left">メモ</th>
              <th className="px-2 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r, idx) => (
              <tr key={idx} className="bg-white hover:bg-gray-50">
                <td className="px-2 py-1 w-16">
                  <input inputMode="numeric" pattern="[0-9]*" className="table-input text-center" value={r.horse_no} onChange={e => updateRow(idx, { horse_no: e.target.value })} />
                </td>
                <td className="px-2 py-1 min-w-[12rem]">
                  <input className="table-input" value={r.horse_name} onChange={e => updateRow(idx, { horse_name: e.target.value })} />
                </td>
                {predictors.map(p => (
                  <td key={p} className="px-2 py-1 w-20">
                    <select className="table-input" value={r.marks[p]} onChange={e => {
                      const marks = { ...r.marks, [p]: e.target.value as Mark }
                      updateRow(idx, { marks })
                    }}>
                      {ALL_MARKS.map(m => <option key={m} value={m}>{m || '—'}</option>)}
                    </select>
                  </td>
                ))}
                <td className="px-2 py-1 min-w-[10rem]">
                  <input className="table-input" value={r.comment ?? ''} onChange={e => updateRow(idx, { comment: e.target.value })} />
                </td>
                <td className="px-2 py-1 w-12 text-right">
                  <button className="text-xs text-red-600 hover:underline" onClick={() => deleteRow(idx)}>削除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile: cards */}
      <div className="md:hidden space-y-3">
        {rows.map((r, idx) => (
          <div key={idx} className="rounded-md border border-gray-200 bg-white p-3 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <input inputMode="numeric" pattern="[0-9]*" className="input w-16 text-center" placeholder="#" value={r.horse_no} onChange={e => updateRow(idx, { horse_no: e.target.value })} />
              <input className="input flex-1" placeholder="馬名" value={r.horse_name} onChange={e => updateRow(idx, { horse_name: e.target.value })} />
              <button className="text-xs text-red-600 ml-auto" onClick={() => deleteRow(idx)}>削除</button>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {predictors.map(p => (
                <div key={p} className="flex items-center gap-1">
                  <span className="text-xs text-gray-600">{p}</span>
                  <div className="flex gap-1">
                    {ALL_MARKS.map(m => (
                      <button
                        key={m}
                        className={`px-2 py-1 text-xs rounded-md ring-1 ring-inset ${r.marks[p] === m ? 'bg-indigo-600 text-white ring-indigo-600' : 'bg-white text-gray-900 ring-gray-300'}`}
                        onClick={() => updateRow(idx, { marks: { ...r.marks, [p]: m } })}
                      >
                        {m || '—'}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2">
              <input className="input" placeholder="メモ" value={r.comment ?? ''} onChange={e => updateRow(idx, { comment: e.target.value })} />
            </div>
          </div>
        ))}
        <div className="pt-1">
          <button className="btn btn-primary w-full" onClick={addRow}>行を追加</button>
        </div>
      </div>
    </div>
  )
}
