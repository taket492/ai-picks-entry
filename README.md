# AI予想屋の印 — 1〜12R・4予想家

直感的に印を入力し、4人の予想家の重みと◎のみでスコア化して並び替えるWebアプリ。12レースを一括で管理し、Vercel Postgres に自動保存します（URLの `?id=...` 単位）。

## セットアップ

```bash
npm install
npm run dev
# http://localhost:5173
```

## 主要機能
- 1〜12Rの切替管理
- 4予想家（A/B/C/D）の名前・重み設定
- 馬ごとに A〜D の印（—/◎/○/▲/△/×）入力
- スコア = Σ(予想家重み × 1[印=◎]) で並び替え
- 全レースで最もスコアの高いレース/馬を表示
- 自動保存（600msデバウンス）/ 自動読込（URL `?id=`）

## デプロイ（Vercel）
- Build Command: `npm run build`
- Output Directory: `dist`
- Env: `POSTGRES_URL`（Vercel Postgres を有効化すると自動注入も可）

## サーバレスAPI（Vercel）
- `POST /api/new` → `{ id }`（8文字ID 発行）
- `POST /api/save` → `{ id, payload }` を UPSERT（`entries` テーブル）
- `GET  /api/load?id=...` → `{ id, payload }` を返却

## データスキーマ（保存）
```ts
interface Payload {
  predictors: { id: 'A'|'B'|'C'|'D'; name: string; weight: number }[]
  races: { race_no: number; info: Partial<RaceInfo>; rows: Row[] }[]
}
```

## 技術
- React + TypeScript + Vite + Tailwind CSS
- Vercel Functions + Vercel Postgres

# ai-picks-entry
