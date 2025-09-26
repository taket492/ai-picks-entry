import React, { useMemo } from 'react'
import type { RaceData, Predictor } from '../types'
import { scoreRowByPicks, countStars } from '../utils/marks'

interface Props {
  races: RaceData[]
  predictors: Predictor[]
}

type BestHorse = { race_no: number; horse_no: string; horse_name: string; score: number; stars: number }

export default function GlobalBest({ races, predictors }: Props) {
  const top3 = useMemo(() => {
    const list: BestHorse[] = []
    for (const r of races) {
      for (const row of r.rows) {
        const score = scoreRowByPicks(row, predictors)
        const stars = countStars(row)
        list.push({ race_no: r.race_no, horse_no: row.horse_no, horse_name: row.horse_name, score, stars })
      }
    }
    list.sort((a,b) => (b.score - a.score) || (b.stars - a.stars) || (Number(a.horse_no) - Number(b.horse_no)))
    return list.slice(0, 3)
  }, [races, predictors])

  if (top3.length === 0) return (
    <div className="text-sm text-gray-500">まだデータが足りません。</div>
  )

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-700">全レース上位3つ</h3>
      <div className="space-y-1">
        {top3.map((h, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <div>
              <span className="text-xs text-gray-500">#{i+1}</span>{' '}
              <span className="font-medium">R{h.race_no}</span>{' '}
              <span className="font-medium">{h.horse_no}</span>{' '}
              <span>{h.horse_name}</span>
            </div>
            <div className="text-xs text-gray-600">スコア {h.score.toFixed(2)} / ◎{h.stars}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
