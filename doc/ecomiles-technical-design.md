# EcoMiles 技術設計書

## 1. システム概要

EcoMilesは、環境に優しい移動手段（サイクリング、ウォーキング、ランニング）を奨励するウェブアプリケーションです。Stravaと連携し、ユーザーのアクティビティに基づいてポイントを付与し、ランキング・バッジ・環境貢献指標として活用する。

## 2. 技術スタック

### フロントエンド
- **フレームワーク**: Next.js (App Router)
- **UI**: React + TypeScript
- **スタイリング**: Tailwind CSS (Lucide-react, Framer Motion)
- **UIコンポーネント**: shadcn/ui

### バックエンド
- **サーバー**: Next.js APIルート
- **データベース**: Supabase (PostgreSQL)
- **ORM**: Prisma
- **認証**: Clerk

### インフラ
- **ホスティング**: Vercel
- **CI/CD**: GitHub連携によるVercel自動デプロイ

### 外部API連携
- **アクティビティデータ**: Strava API (OAuth 2.0)

## 3. システムアーキテクチャ

### 3.1 全体構成図

```
[ユーザー] ← → [Webブラウザ] ← → [Vercel (Next.js)] ← → [Supabase (DB)]
                                  ↑             ↓
                                  ↑      [外部認証/API]
                                  ↑      ↙          ↘
                          [Strava API]        [Clerk Auth]
```

### 3.2 データベース設計

#### ユーザーテーブル (`users`)
```prisma
model User {
  id                  String      @id
  email               String      @unique
  name                String?
  createdAt           DateTime    @default(now())
  stravaConnected     Boolean     @default(false)
  stravaAthleteId     String?
  stravaAccessToken   String?
  stravaRefreshToken  String?
  stravaExpiresAt     DateTime?
  activities          Activity[]
  points              Point[]
  badges              UserBadge[]
}
```

#### アクティビティテーブル (`activities`)
```prisma
model Activity {
  id                 String       @id @default(uuid())
  userId             String
  stravaActivityId   String       @unique
  activityType       ActivityType // Enum: Ride, Run, Walk
  distance           Float        // km
  eligibleForPoints  Boolean      @default(true)
  pointsAwarded      Int          @default(0)
  createdAt          DateTime     @default(now())
  activityDate       DateTime     // アクティビティ開始時刻 (UTC)
}
```

#### ポイントテーブル (`points`)
```prisma
model Point {
  id              String    @id @default(uuid())
  userId          String
  activityId      String?
  points          Int
  description     String
  transactionType String    @default("Earned")
  createdAt       DateTime  @default(now())
}
```

## 4. 主要機能の実装詳細

### 4.1 タイムゾーン対応
サーバーサイドでのデータ集計（YYYY-MM-DD形式のキー生成）およびフロントエンドでの表示において、一貫して `Asia/Tokyo` タイムゾーンを使用する。
```typescript
const dateKey = activity.activityDate.toLocaleDateString("sv-SE", {
  timeZone: "Asia/Tokyo",
});
```

### 4.2 ポイント計算・付与システム

#### 計算ロジック
- **ウォーキング**: 1km = 1.0pt
- **ランニング**: 1km = 1.5pt
- **自転車**: 1km = 0.5pt
- **上限**: 1アクティビティあたり最大100pt

```typescript
export const calculatePoints = (type: ActivityType, distanceInMeters: number): number => {
  const distanceKm = distanceInMeters / 1000;
  let multiplier = 0;
  switch (type) {
    case ActivityType.Run: multiplier = 1.5; break;
    case ActivityType.Walk: multiplier = 1.0; break;
    case ActivityType.Ride: multiplier = 0.5; break;
  }
  const points = Math.floor(distanceKm * multiplier);
  return Math.min(points, 100);
};
```

### 4.3 デモモードの実装
新規ユーザーが即座に機能を体験できるよう、過去180日分のダミーデータを生成するエンドポイント `/api/demo/seed` を提供。
- **データ隔離**: デモ用の `stravaActivityId` には `demo-` プレフィックスを付与。
- **集計除外**: グローバル統計（Collective Impact）およびリーダーボードのクエリでは、`demo-` プレフィックスを持つデータを除外。

### 4.4 統計データの取得

#### みんなの貢献 (Collective Impact)
本物のデータのみを集計。
```prisma
const stats = await prisma.activity.aggregate({
  where: { NOT: { stravaActivityId: { startsWith: "demo-" } } },
  _sum: { distance: true },
  _count: { id: true }
});
```

#### リーダーボード
デモ活動によるポイントを除外してユーザーごとに集計。

## 5. UI/UX設計

### 5.1 画面構成 (2カラムレイアウト)
- **ダッシュボード**
  - **リアルタイムメトリクス**: 4枚の主要カード + 3枚の補足カード。
  - **メインコンテンツ (2/3)**: アクティビティ履歴（フィルタリング、ページネーション対応）、アクティビティ・カレンダー、みんなの貢献。
  - **サイドバー (1/3)**: 獲得バッジ一覧、リーダーボード。
  - **デモバナー**: デモデータ保持時に表示。Strava連携への誘導を含む。

### 5.2 アニメーション
- `framer-motion` を使用し、ツールチップのフェード、数字のカウントアップ、ページ遷移などを実装。

## 6. セキュリティ対策
- **Clerk連携**: `auth()` を使用したリクエスト保護。
- **Strava OAuth**: リフレッシュトークンによる自動更新。
- **環境変数**: `DATABASE_URL`, `STRAVA_CLIENT_ID`, `CLERK_SECRET_KEY` 等の安全な管理。

## 7. 拡張・将来計画
- **シェアカードの画像化**: 現在はDOMでの表示のみ。Canvas等を使用した画像生成と直接シェア機能の追加。
- **ストリーク判定**: カレンダーの連続性をサーバーサイドで判定し、バッジを付与するロジックの追加。
- **地図表示**: アクティビティごとの経路表示（プライバシーに配慮した簡略化版）。
