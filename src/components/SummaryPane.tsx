import React, { useMemo } from 'react'
import type { Row, Predictor } from '../types'
import { countStars, scoreRowByPicks } from '../utils/marks'

interface Props {
  rows: Row[]
  predictors: Predictor[]
}

export default function SummaryPane({ rows, predictors }: Props) {
  const sorted = useMemo(() => {
    const list = rows.map(r => ({
      ...r,
      stars: countStars(r),
      score: scoreRowByPicks(r, predictors),
    }))
    list.sort((a,b) => {
      if (b.score !== a.score) return b.score - a.score
      if (b.stars !== a.stars) return b.stars - a.stars
      return Number(a.horse_no) - Number(b.horse_no)
    })
    return list
  }, [rows, predictors])

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-gray-700">レース内 並び替え（重み×◎数）</h3>
        <p className="text-xs text-gray-500">スコア = Σ(予想家重み × 1[印=◎])</p>
      </div>
      <div className="border border-gray-200 rounded-md overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="px-2 py-2 text-left">順位</th>
              <th className="px-2 py-2 text-left">馬番</th>
              <th className="px-2 py-2 text-left">馬名</th>
              <th className="px-2 py-2 text-left">◎数</th>
              <th className="px-2 py-2 text-left">スコア</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {sorted.map((r, i) => (
              <tr key={`${r.horse_no}-${i}`}>
                <td className="px-2 py-1 w-14">{i+1}</td>
                <td className="px-2 py-1 w-16">{r.horse_no}</td>
                <td className="px-2 py-1">{r.horse_name}</td>
                <td className="px-2 py-1 w-14">{r.stars}</td>
                <td className="px-2 py-1 w-20">{r.score.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
