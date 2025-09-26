import React from 'react'

export default function MobileToolbar({
  onPrev,
  onNext,
  onAdd,
  current,
  total,
  savingText,
}: {
  onPrev: () => void
  onNext: () => void
  onAdd: () => void
  current: number
  total: number
  savingText?: string
}) {
  return (
    <div className="mobile-toolbar">
      <button aria-label="前のレース" className="btn btn-secondary min-h-[44px]" onClick={onPrev} disabled={current <= 1}>前へ</button>
      <div className="text-xs text-gray-700 font-medium">
        R{current} / {total}
        {savingText ? <span className="ml-2 text-gray-500">{savingText}</span> : null}
      </div>
      <button aria-label="行を追加" className="btn btn-primary min-h-[44px]" onClick={onAdd}>行を追加</button>
      <button aria-label="次のレース" className="btn btn-secondary min-h-[44px]" onClick={onNext} disabled={current >= total}>次へ</button>
    </div>
  )
}

