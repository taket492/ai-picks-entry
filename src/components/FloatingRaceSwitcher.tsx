import React from 'react'

export default function FloatingRaceSwitcher({
  current,
  total,
  onPrev,
  onNext,
  onJump,
}: {
  current: number
  total: number
  onPrev: () => void
  onNext: () => void
  onJump: (n: number) => void
}) {
  return (
    <div className="hidden md:flex fixed bottom-4 right-4 z-20 shadow-lg">
      <div className="flex items-center gap-2 rounded-full border border-gray-300 bg-white/95 backdrop-blur px-3 py-2">
        <button className="btn btn-secondary" onClick={onPrev}>&larr; 前</button>
        <div className="text-sm text-gray-700">R{current}/{total}</div>
        <button className="btn btn-secondary" onClick={onNext}>次 &rarr;</button>
        <select
          className="input"
          value={current}
          onChange={e => onJump(Number(e.target.value))}
          aria-label="レースへジャンプ"
        >
          {Array.from({ length: total }).map((_, i) => (
            <option key={i + 1} value={i + 1}>R{i + 1}へ</option>
          ))}
        </select>
        <span className="ml-1 text-xs text-gray-500">ショートカット: ←/→, 数字1-0</span>
      </div>
    </div>
  )
}

