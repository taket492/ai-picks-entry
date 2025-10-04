import React from 'react'

export default function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
      <span className="font-medium text-gray-700">印の意味:</span>
      <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 ring-1 ring-inset ring-gray-200">◎ 本命</span>
      <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 ring-1 ring-inset ring-gray-200">○ 対抗</span>
      <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 ring-1 ring-inset ring-gray-200">▲ 単穴</span>
      <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 ring-1 ring-inset ring-gray-200">△ 連下</span>
      <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 ring-1 ring-inset ring-gray-200">× 注意</span>
      <span className="ml-auto text-[11px] text-gray-500">ヒント: 行アクションで印を全クリア/コピー</span>
    </div>
  )
}

