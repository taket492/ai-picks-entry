import React, { useMemo } from 'react'
import type { RaceData, Predictor } from '../types'
import { scoreRowByPicks, countStars } from '../utils/marks'

interface Props {
  races: RaceData[]
  predictors: Predictor[]
}

type BestHorse = { horse_no: string; horse_name: string; score: number; stars: number }

export default function GlobalBest({ races, predictors }: Props) {
  const best = useMemo(() => {
    let bestRace: number | null = null
    let bestHorse: BestHorse | null = null
    for (const r of races) {
      let localBest: BestHorse | null = null
      for (const row of r.rows) {
        const score = scoreRowByPicks(row, predictors)
        const stars = countStars(row)
        const item: BestHorse = { horse_no: row.horse_no, horse_name: row.horse_name, score, stars }
        if (!localBest || score > localBest.score || (score === localBest.score && stars > localBest.stars)) {
          localBest = item
        }
      }
      if (localBest) {
        if (!bestHorse || localBest.score > bestHorse.score || (localBest.score === bestHorse.score && localBest.stars > bestHorse.stars)) {
          bestHorse = localBest
          bestRace = r.race_no
        }
      }
    }
    return { bestRace, bestHorse }
  }, [races, predictors])

  if (!best.bestHorse || best.bestRace == null) return (
    <div className="text-sm text-gray-500">まだデータが足りません。</div>
  )

  return (
    <div className="space-y-1">
      <h3 className="text-sm font-semibold text-gray-700">全レースで一番スコアが高いレース</h3>
      <p className="text-sm">R{best.bestRace}: {best.bestHorse.horse_no} {best.bestHorse.horse_name}</p>
      <p className="text-xs text-gray-600">スコア {best.bestHorse.score.toFixed(2)} / ◎{best.bestHorse.stars}</p>
    </div>
  )
}
