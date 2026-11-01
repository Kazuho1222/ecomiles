# EcoMiles (エコマイルズ)

Intervals.icuと連携して、自転車走行、ウォーキング、ランニングなどの環境に優しい移動をポイント化し、地球への貢献を可視化するウェブアプリケーションです。

## 🚀 プロジェクト概要

「移動を、地球への貢献に。」
EcoMilesは、日々のエコな移動を記録し、CO2削減量や具体的な環境指標（杉の木換算など）に変換することで、持続可能なライフスタイルを楽しく継続できるようサポートします。

## ✨ 主な機能

- **Intervals.icu連携**: Intervals.icuのアクティビティを自動同期し、エコな移動を抽出します。
- **デモモード**: アカウント連携なしでもワンクリックで過去180日分のダミーアクティビティを生成し、全機能を体験可能。
- **リアルタイムダッシュボード**: 獲得ポイント、CO2削減量、地球の寿命延長時間などをリアルタイムに表示。
- **アクティビティ履歴**: 過去のアクティビティをページネーションで遡って確認可能。
- **ランキング & バッジ**: 他のユーザーとの競い合いや、実績解除によるゲーミフィケーション。
- **SNSシェア**: 自分の環境貢献度を画像として生成し、SNSにシェアできます。
- **完全日本語対応**: 日本人ユーザーに最適化されたUI。

## 🧪 動作確認用テストアカウント

Intervals.icuアカウントを連携できない方のために、動作確認用のテストアカウントを用意しています。

- **デモ用メールアドレス**: `test+clerk_test@example.com`
- **デモ用パスワード**: `EcoMiles2026!`
- **テスト検証コード**: `424242` (ログイン時にコードを求められた際に入力してください)

## 🛠 技術スタック

- **Framework**: [Next.js (App Router)](https://nextjs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/), [lucide-react](https://lucide.dev/)
- **Database**: [PostgreSQL (Supabase)](https://supabase.com/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Authentication**: [Clerk](https://clerk.com/)
- **API**: Intervals.icu API (OAuth 2.0 / Webhook)

## 📦 セットアップ

1. **リポジトリのクローン**
   ```bash
   git clone <repository-url>
   cd ecomiles
   ```

2. **依存関係のインストール**
   ```bash
   npm install
   ```

3. **環境変数の設定**
   `.env` または `.env.local` ファイルを作成し、以下の項目を設定してください（詳細は `.env.example` を参照）。
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `DATABASE_URL`
   - `INTERVALS_CLIENT_ID`
   - `INTERVALS_CLIENT_SECRET`
   - `INTERVALS_REDIRECT_URI`
   - `INTERVALS_WEBHOOK_SECRET`

4. **データベースのセットアップ**
   ```bash
   npx prisma migrate dev
   ```

5. **開発サーバーの起動**
   ```bash
   npm run dev
   ```

## 🔔 Intervals.icu Webhook 設定

Intervals.icu からのリアルタイムアクティビティ同期を受信する場合:
1. Intervals.icu にログインし、**Settings → Apps → Manage App** にアクセスします。
2. Webhook URL に `https://<YOUR_DOMAIN>/api/intervals/webhook` を登録します。
3. 設定した Webhook Secret を環境変数 `INTERVALS_WEBHOOK_SECRET` に設定します。
4. ローカルやステージング環境での疎通確認は `npx tsx scripts/test-intervals-webhook.ts` を使用できます。

## 📈 ロードマップ

- [x] フェーズ1: MVP（基本機能・ダッシュボード）
- [x] フェーズ2: UI/UX改善・日本語化・ページネーション・Intervals.icu移行
- [ ] フェーズ3: コミュニティ機能・SNS連携強化
