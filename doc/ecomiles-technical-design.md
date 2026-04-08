# EcoMiles 技術設計書

## 1. システム概要

EcoMilesは、環境に優しい移動手段（サイクリング、ウォーキング、ランニング）を奨励するウェブアプリケーションです。Stravaと連携し、ユーザーのアクティビティに基づいてポイントを付与し、ランキング・バッジ・環境貢献指標として活用する。

## 2. 技術スタック

### フロントエンド
- **フレームワーク**: Next.js (App Router)
- **UI**: React + TypeScript
- **スタイリング**: Tailwind CSS
- **UIコンポーネント**: shadcn/ui

### バックエンド
- **サーバー**: Next.js APIルート
- **データベース**: Supabase (PostgreSQL)
- **ORM**: Prisma
- **認証**: Clerk

### インフラ
- **ホスティング**: Vercel
- **ストレージ**: Supabase Storage
- **CI/CD**: Vercel自動デプロイ

### 外部API連携
- **アクティビティデータ**: Strava API
- **広告**: Google AdSense（または適切な広告プラットフォーム）

## 3. システムアーキテクチャ

### 3.1 全体構成図

```
[ユーザー] ← → [Webブラウザ] ← → [Vercel (Next.js)] ← → [Supabase (Auth/DB)]
                                  ↑             ↓
                                  ↑      [外部API連携]
                                  ↑         ↙
                          [Strava API]   [広告API]
```

### 3.2 データベース設計

#### ユーザーテーブル
```
users
- id: UUID (PK)
- email: String (unique)
- name: String
- created_at: DateTime
- strava_connected: Boolean
- strava_athlete_id: String
- strava_access_token: String
- strava_refresh_token: String
- strava_expires_at: DateTime
```

#### アクティビティテーブル
```
activities
- id: UUID (PK)
- user_id: UUID (FK -> users.id)
- strava_activity_id: String
- activity_type: Enum (Ride, Run, Walk)
- distance: Float (km単位)
- start_location
- end_location
- eligible_for_points: Boolean
- points_awarded: Integer
- created_at: DateTime
- activity_date: DateTime
```

#### ポイントテーブル
```
points
- id: UUID (PK)
- user_id: UUID (FK -> users.id)
- activity_id: UUID (FK -> activities.id, nullable)
- points: Integer
- description: String
- transaction_type（Earnedのみ）
- created_at: DateTime
```

## 4. 主要機能の実装詳細

### 4.1 Strava連携

#### OAuth認証フロー
1. ユーザーがStravaへの連携を要求
2. Stravaの認証画面にリダイレクト
3. 認証後、コールバックURLで認可コードを受け取る
4. 認可コードを使ってアクセストークンとリフレッシュトークンを取得
5. トークン情報をデータベースに保存

#### トークン更新処理
- Cron Jobを使用し、期限切れ間近のトークンを自動更新
- Next.jsのAPIルートを活用したバッチ処理の実装

#### APIリクエスト制限対策
- レート制限を考慮したリクエストキューの実装
- キャッシュ戦略の導入

```typescript
// トークン更新処理の例
async function refreshStravaToken(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  if (!user || !user.strava_refresh_token) return null;
  
  const response = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: user.strava_refresh_token
    })
  });
  
  const data = await response.json();
  
  await prisma.user.update({
    where: { id: userId },
    data: {
      strava_access_token: data.access_token,
      strava_refresh_token: data.refresh_token,
      strava_expires_at: new Date(Date.now() + data.expires_in * 1000)
    }
  });
  
  return data.access_token;
}
```

### 4.2 ポイント計算・付与システム

#### アクティビティ同期処理
1. 定期的な（または手動トリガーによる）Stravaからの新規アクティビティ取得
2. ポイント付与条件を満たすか確認（距離、活動タイプなど）
3. ポイントを計算し、データベースに記録

```typescript
async function syncActivitiesAndAwardPoints(userId: string) {
  const user = await prisma.user.findUnique({ 
    where: { id: userId } 
  });
  
  if (!user || !user.strava_access_token) return null;
  
  // 最後に同期したアクティビティの日時を取得
  const lastActivity = await prisma.activity.findFirst({
    where: { user_id: userId },
    orderBy: { activity_date: 'desc' }
  });
  
  // Stravaから新しいアクティビティを取得
  const activities = await fetchStravaActivities(
    user.strava_access_token, 
    lastActivity?.activity_date
  );
  
  for (const activity of activities) {
    // ポイント付与条件の確認
    const eligibleForPoints =
      ['Run', 'Ride', 'Walk'].includes(activity.type);
    
    // 距離に基づくポイント計算（1km = 1ポイント）
    const distanceKm = activity.distance / 1000; // メートルからキロメートルに変換
    const pointsAwarded = eligibleForPoints ? Math.floor(distanceKm) : 0;
    
    // アクティビティをDBに保存
    const savedActivity = await prisma.activity.create({
      data: {
        user_id: userId,
        strava_activity_id: activity.id.toString(),
        activity_type: activity.type,
        distance: distanceKm,
        start_location: {
          latitude: activity.start_latlng[0],
          longitude: activity.start_latlng[1]
        },
        end_location: {
          latitude: activity.end_latlng[0],
          longitude: activity.end_latlng[1]
        },
        starts_from_home: startsFromHome,
        ends_at_home: endsAtHome,
        eligible_for_points: eligibleForPoints,
        points_awarded: pointsAwarded,
        activity_date: new Date(activity.start_date)
      }
    });
    
    // ポイントを付与
    if (pointsAwarded > 0) {
      await prisma.points.create({
        data: {
          user_id: userId,
          activity_id: savedActivity.id,
          points: pointsAwarded,
          description: `${activity.type} - ${distanceKm.toFixed(2)}km`,
          transaction_type: 'Earned'
        }
      });
    }
  }
}
```

### 4.4 不正検出システム

#### 異常検出ロジック
- 移動速度の異常値検出
- 同一ルートの繰り返し検出
- 短時間での複数アクティビティの検出

```typescript
function detectAnomalousActivity(activity, userHistory) {
  const speedKmPerHour = activity.distance / (activity.moving_time / 3600);
  const activityType = activity.type;
  
  // 活動タイプ別の速度閾値（km/h）
  const speedThresholds = {
    'Run': 25,  // マラソン世界記録の約2倍
    'Ride': 100, // プロサイクリストの最高速度を超える値
    'Walk': 10   // 速歩よりかなり速い
  };
  
  // 速度の異常検出
  if (speedKmPerHour > speedThresholds[activityType]) {
    return {
      suspicious: true,
      reason: `Unusually high speed: ${speedKmPerHour.toFixed(1)} km/h for ${activityType}`
    };
  }
  
  // その他の不正検出ロジック
  // ...
  
  return { suspicious: false };
}
```

## 5. UI/UX設計

### 5.1 画面構成

#### 主要画面
1. **ホーム/ダッシュボード**
   - ポイント残高表示
   - 最近のアクティビティ表示
   - 環境貢献度の可視化（CO2削減量など）

2. **アクティビティ履歴**
   - Stravaから同期したアクティビティリスト
   - ポイント獲得履歴
   - フィルタリング・検索機能

3. **プロフィール設定**
   - 個人情報管理
   - Strava連携管理

### 5.2 レスポンシブデザイン

- モバイル最適化（スマートフォンが主要ターゲット）
- デスクトップブラウザ対応
- Tailwind CSSによるデバイス対応

## 6. デプロイメント・運用

### 6.1 デプロイメントパイプライン

- GitHub連携によるVercel自動デプロイ
- ステージング環境と本番環境の分離
- 環境変数による設定管理

### 6.2 モニタリング・ロギング

- Vercelのビルトインモニタリング
- アプリケーションログの集中管理
- エラー検知と自動通知

### 6.3 バックアップ戦略

- Supabaseによる自動バックアップ
- 定期的なデータエクスポート

## 7. セキュリティ対策

### 7.1 認証・認可

- Clerkによる安全な認証システム
- RBAC（Role-Based Access Control）の実装
- CSRFトークンによる保護

### 7.2 データ保護

- センシティブデータの暗号化
- HTTPSによる通信暗号化
- 個人情報の最小限収集

### 7.3 API セキュリティ

- レート制限の実装
- 適切なCORS設定
- API鍵の安全な管理

## 8. 収益モデル実装（広告）

- 非侵襲的な広告配置
- コンテンツとの関連性を考慮した広告表示
- アドブロック検出と代替コンテンツ表示

```typescript
// アドブロック検出の例
function detectAdBlocker() {
  return new Promise((resolve) => {
    let adBlockDetected = false;
    const testAd = document.createElement('div');
    testAd.innerHTML = '&nbsp;';
    testAd.className = 'adsbox';
    document.body.appendChild(testAd);
    
    window.setTimeout(() => {
      if (testAd.offsetHeight === 0) {
        adBlockDetected = true;
      }
      testAd.remove();
      resolve(adBlockDetected);
    }, 100);
  });
}

// 使用例
useEffect(() => {
  async function checkAdBlocker() {
    const isBlocking = await detectAdBlocker();
    if (isBlocking) {
      // アドブロックが検出された場合の処理
      setShowAdBlockMessage(true);
    }
  }
  
  checkAdBlocker();
}, []);
```

## 9. 拡張・将来計画

### 9.1 技術的拡張性

- マイクロサービスへの移行準備
- APIゲートウェイの設計
- サードパーティ統合のための拡張ポイント

### 9.2 機能拡張ロードマップ

- 環境貢献度のより高度な可視化
- チーム・コミュニティ機能
- 地域特化型キャンペーン
- AIによる活動分析と提案

## 10. リスク管理・コンプライアンス

### 10.1 利用規約・プライバシーポリシー

- 明確なサービス利用条件の定義
- 個人情報取り扱いの透明性確保
- ポイント制度変更に関する条項

### 10.2 法規制対応

- 個人情報保護法への対応
- 特定商取引法への対応（必要に応じて）
- 景品表示法への対応

## 11. 初期リリース範囲

- Strava連携基本機能
- ポイント付与機能
- 基本的なダッシュボード
- 最小限の広告実装

---

この設計書は開発の初期段階におけるガイドラインであり、開発進行に伴い適宜更新・調整を行う。
