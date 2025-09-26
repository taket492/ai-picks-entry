import React, { useMemo } from 'react'
import type { Predictor, Row } from '../types'
import { countStars, scoreRowByPicks } from '../utils/marks'

export default function MiniSummary({ rows, predictors }: { rows: Row[]; predictors: Predictor[] }) {
  const top = useMemo(() => {
    const list = rows.map(r => ({
      no: r.horse_no,
      name: r.horse_name,
      stars: countStars(r),
      score: scoreRowByPicks(r, predictors),
    }))
    list.sort((a,b) => (b.score - a.score) || (b.stars - a.stars) || (Number(a.no) - Number(b.no)))
    return list.slice(0, 3)
  }, [rows, predictors])

  if (top.length === 0) return null

  return (
    <div className="sticky top-2 z-10">
      <div className="grid grid-cols-3 gap-2">
        {top.map((r, i) => (
          <div key={i} className="rounded-md border border-gray-200 bg-white p-2 shadow-sm">
            <div className="text-[10px] text-gray-500">#{i+1}</div>
            <div className="text-sm font-semibold">{r.no} {r.name || ''}</div>
            <div className="text-xs text-gray-600">◎{r.stars} / {r.score.toFixed(2)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

