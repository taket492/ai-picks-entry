import type { Mark, PredictorId, Row, Predictor } from '../types'

export const MARK_SCORES: Record<Mark, number> = {
  '◎': 5,
  '○': 4,
  '▲': 3,
  '△': 2,
  '×': 1,
  '': 0,
}

export const ALL_MARKS: Mark[] = ['','◎','○','▲','△','×']

export function markToScore(mark: Mark): number {
  return MARK_SCORES[mark] ?? 0
}

export function scoreRowByPicks(row: Row, predictors: Predictor[]): number {
  // ◎ に対してのみ各予想家の重みを加点
  const weightMap = Object.fromEntries(predictors.map(p => [p.id, p.weight])) as Record<PredictorId, number>
  let sum = 0
  for (const id of Object.keys(row.marks) as PredictorId[]) {
    if (row.marks[id] === '◎') sum += (weightMap[id] ?? 0)
  }
  return sum
}

export function countStars(row: Row): number {
  let n = 0
  for (const m of Object.values(row.marks)) if (m === '◎') n++
  return n
}
