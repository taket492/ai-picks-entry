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
- 日付・開催から12Rの馬番/馬名を自動取り込み（「データ作成」ボタン）

## デプロイ（Vercel）
- Build Command: `npm run build`
- Output Directory: `dist`
- Env: `POSTGRES_URL`（Vercel Postgres を有効化すると自動注入も可）

## サーバレスAPI（Vercel）
- `POST /api/new` → `{ id }`（8文字ID 発行）
- `POST /api/save` → `{ id, payload }` を UPSERT（`entries` テーブル）
- `GET  /api/load?id=...` → `{ id, payload }` を返却
- `GET  /api/fetch-card?date=YYYY-MM-DD&course=tokyo` → 当日の全レース馬番/馬名を返却（現状モック実装）。

### 取得元プロバイダの設定（実運用）
- 環境変数 `CARD_PROVIDER_URL` を設定すると、`/api/fetch-card` はそのURLへ `date`, `course` を付与してプロキシします。
- 必要に応じて `CARD_PROVIDER_AUTH_HEADER`, `CARD_PROVIDER_AUTH_VALUE` を設定すると、任意のヘッダで認証情報を付与します。
- 期待するレスポンス形式（JSON）
  ```json
  {
    "races": [
      { "race_no": 1, "horses": [ { "horse_no": "1", "horse_name": "サンプル" } ] }
    ]
  }
  ```
  `race_no` は 1〜12、`horse_no` は文字列、`horse_name` は馬名。

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
