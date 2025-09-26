import React from 'react'
import type { Predictor, PredictorId } from '../types'

interface Props {
  predictors: Predictor[]
  onChange: (next: Predictor[]) => void
}

export default function PredictorsSettings({ predictors, onChange }: Props) {
  function update(id: PredictorId, patch: Partial<Predictor>) {
    const next = predictors.map(p => p.id === id ? { ...p, ...patch } : p)
    onChange(next)
  }
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-3">
        {predictors.map(p => (
          <div key={p.id} className="border rounded-md p-3 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-700">予想家 {p.id}</span>
            </div>
            <label className="label">名前</label>
            <input className="input" value={p.name} onChange={e => update(p.id, { name: e.target.value })} />
            <div className="mt-2">
              <label className="label">重み</label>
              <input className="input" type="number" step="0.1" value={p.weight} onChange={e => update(p.id, { weight: Number(e.target.value) })} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

