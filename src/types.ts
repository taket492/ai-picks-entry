export type Mark = '◎' | '○' | '▲' | '△' | '×' | ''

export interface RaceInfo {
  race_date: string // YYYY-MM-DD
  course_code: string
  course_name: string
  race_no: string
  race_name?: string
}

export type PredictorId = 'A' | 'B' | 'C' | 'D'

export interface Predictor {
  id: PredictorId
  name: string
  weight: number
}

export interface Row {
  horse_no: string
  horse_name: string
  marks: Record<PredictorId, Mark>
  comment?: string
  updated_at?: string
}

export interface RaceData {
  race_no: number
  info: Partial<RaceInfo>
  rows: Row[]
}
