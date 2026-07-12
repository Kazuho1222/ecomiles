import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPolicy() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-between p-8 lg:p-24 bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100 transition-colors duration-500">
			<main className="flex flex-col items-start justify-center flex-1 w-full max-w-3xl">
				{/* ヘッダー */}
				<div className="w-full flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-6 mb-12">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400">
							<Shield size={24} />
						</div>
						<h1 className="text-3xl font-sans font-black tracking-tighter text-emerald-600 dark:text-emerald-500">
							EcoMiles
						</h1>
					</div>
					<Link
						href="/"
						className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-full shadow-sm transition-all"
					>
						<ArrowLeft size={14} />
						ホームへ戻る
					</Link>
				</div>

				{/* 本文 */}
				<div className="w-full space-y-8 font-sans leading-relaxed">
					<div>
						<h2 className="text-2xl font-black mb-4">プライバシーポリシー</h2>
						<p className="text-slate-500 dark:text-slate-400 text-sm">
							最終更新日: 2026年7月12日
						</p>
						<p className="mt-4 text-slate-600 dark:text-slate-300">
							EcoMiles（以下「当サービス」）は、ユーザーの個人情報の重要性を認識し、その適切な保護と管理に細心的注意を払っております。本プライバシーポリシーでは、当サービスがどのような情報を収集し、どのように利用・管理するかについて説明します。
						</p>
					</div>

					<section className="space-y-4">
						<h3 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
							<span className="text-emerald-500">1.</span> 収集する情報
						</h3>
						<p className="text-slate-600 dark:text-slate-300">
							当サービスは、機能の提供およびサービス向上のため、以下の情報を取得・利用します。
						</p>
						<ul className="list-inside list-disc pl-4 space-y-2 text-slate-600 dark:text-slate-300">
							<li>
								<strong className="text-slate-800 dark:text-slate-200">アカウント情報:</strong> ログインおよびユーザー認証の目的で、Clerk経由でメールアドレス、お名前、プロフィール画像などを取得します。
							</li>
							<li>
								<strong className="text-slate-800 dark:text-slate-200">アクティビティデータ:</strong> CO2削減量およびエコポイントの計算の目的で、外部連携サービス（Strava API、Intervals.icu APIなど）から、ユーザーの同意のもとでワークアウト・移動ログ（運動種目、距離、移動時間、日付など）を取得します。
							</li>
						</ul>
					</section>

					<section className="space-y-4">
						<h3 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
							<span className="text-emerald-500">2.</span> 情報の利用目的
						</h3>
						<p className="text-slate-600 dark:text-slate-300">
							収集した情報は、以下の目的以外には使用しません。
						</p>
						<ul className="list-inside list-disc pl-4 space-y-2 text-slate-600 dark:text-slate-300">
							<li>当サービスにおけるCO2削減量やエコ貢献度の算出および可視化</li>
							<li>エコポイント、称号、バッジなどのゲーミフィケーション要素の提供</li>
							<li>ユーザー同士のランキング機能への掲載（オプトアウト可能）</li>
							<li>サービス維持のための技術的なトラブルシューティングやお問い合わせ対応</li>
						</ul>
					</section>

					<section className="space-y-4">
						<h3 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
							<span className="text-emerald-500">3.</span> 情報の管理と保管
						</h3>
						<p className="text-slate-600 dark:text-slate-300">
							ユーザーのデータはセキュリティ対策を施したデータベース（Supabase等）に安全に保管され、不正アクセス、紛失、破壊、改ざん、および漏洩を防ぐための合理的な措置を講じています。
						</p>
					</section>

					<section className="space-y-4">
						<h3 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
							<span className="text-emerald-500">4.</span> 第三者への情報提供
						</h3>
						<p className="text-slate-600 dark:text-slate-300">
							当サービスは、ユーザーの同意なしに個人データを第三者に提供、販売、または共有することはありません。ただし、法令に基づく要請がある場合を除きます。
						</p>
					</section>

					<section className="space-y-4">
						<h3 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
							<span className="text-emerald-500">5.</span> データの削除について
						</h3>
						<p className="text-slate-600 dark:text-slate-300">
							ユーザーはいつでも当サービスから連携を解除、またはアカウントを削除することができます。アカウントの削除が実行された場合、当サービスのデータベースに保存されているユーザーの個人データおよびアクティビティデータは速やかにかつ完全に削除されます。
						</p>
					</section>

					<section className="space-y-4">
						<h3 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
							<span className="text-emerald-500">6.</span> プライバシーポリシーの改定
						</h3>
						<p className="text-slate-600 dark:text-slate-300">
							当サービスは、法令の変更やサービス内容の更新に伴い、本プライバシーポリシーを改定することがあります。重要な変更がある場合には、サービス内または適宜の方法でユーザーに通知します。
						</p>
					</section>

					<section className="space-y-4">
						<h3 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
							<span className="text-emerald-500">7.</span> お問い合わせ
						</h3>
						<p className="text-slate-600 dark:text-slate-300">
							本ポリシーまたは個人情報の取り扱いに関するご質問、削除の要請などは、当サービスの開発・管理者までご連絡ください。
						</p>
					</section>
				</div>
			</main>

			<footer className="mt-24 flex flex-col items-center gap-6 py-12 border-t border-slate-200 dark:border-slate-800 w-full max-w-3xl mx-auto">
				<p className="text-xs text-slate-400 font-mono">
					© 2026 EcoMiles. Dedicated to a sustainable future.
				</p>
			</footer>
		</div>
	);
}
