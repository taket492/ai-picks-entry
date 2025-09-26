import React from 'react'
import type { RaceInfo } from '../types'

interface Props {
  value: RaceInfo
  onChange: (v: RaceInfo) => void
}

export default function RaceInfoForm({ value, onChange }: Props) {
  function update<K extends keyof RaceInfo>(key: K, v: RaceInfo[K]) {
    onChange({ ...value, [key]: v })
  }
  return (
    <div className="space-y-3">
      <div>
        <label className="label">日付</label>
        <input type="date" className="input" value={value.race_date} onChange={e => update('race_date', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">コースコード</label>
          <input className="input" placeholder="例: SAPPORO" value={value.course_code} onChange={e => update('course_code', e.target.value)} />
        </div>
        <div>
          <label className="label">コース名</label>
          <input className="input" placeholder="例: 札幌" value={value.course_name} onChange={e => update('course_name', e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">レース番号</label>
          <input className="input" placeholder="例: 11" value={value.race_no} onChange={e => update('race_no', e.target.value)} />
        </div>
        <div>
          <label className="label">レース名（任意）</label>
          <input className="input" placeholder="例: クイーンS" value={value.race_name ?? ''} onChange={e => update('race_name', e.target.value)} />
        </div>
      </div>
    </div>
  )
}

