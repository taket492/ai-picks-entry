import React from 'react'

export interface MeetingInfo {
  race_date?: string
  course_code?: string
  course_name?: string
}

const COURSES: { code: string; name: string }[] = [
  { code: 'sapporo', name: '札幌' },
  { code: 'hakodate', name: '函館' },
  { code: 'fukushima', name: '福島' },
  { code: 'niigata', name: '新潟' },
  { code: 'tokyo', name: '東京' },
  { code: 'nakayama', name: '中山' },
  { code: 'chukyo', name: '中京' },
  { code: 'kyoto', name: '京都' },
  { code: 'hanshin', name: '阪神' },
  { code: 'kokura', name: '小倉' },
]

export default function MeetingControls({ value, onChange }: { value: MeetingInfo; onChange: (v: Partial<MeetingInfo>) => void }) {
  const onDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ race_date: e.target.value })
  }
  const onCourse = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value
    const name = COURSES.find(c => c.code === code)?.name || ''
    onChange({ course_code: code, course_name: name })
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="label">日付</label>
        <input type="date" className="input" value={value.race_date || ''} onChange={onDate} />
      </div>
      <div>
        <label className="label">開催</label>
        <select className="input" value={value.course_code || ''} onChange={onCourse}>
          <option value="">選択してください</option>
          {COURSES.map(c => (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

