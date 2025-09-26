import React, { useState } from 'react'

export default function Collapsible({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <span className="text-base font-semibold">{title}</span>
        <span className="text-gray-500 text-sm">{open ? '閉じる' : '開く'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4">
          {children}
        </div>
      )}
    </div>
  )
}

