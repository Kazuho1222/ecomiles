import {
	Bike,
	Coins,
	Footprints,
	Leaf,
	Snowflake,
	SportShoe,
	Trees,
} from "lucide-react";
import type React from "react";

interface ShareCardProps {
	data: {
		totalPoints: number;
		totalCO2Reduction: number;
		iceSaved: number;
		cedarTrees: number;
		userName: string;
		avatarUrl?: string;
	};
}

/**
 * SNSシェア用のカードコンポーネント
 * 注意: html-to-image でのキャプチャを確実にするため、next/image ではなく標準の img タグを使用しています。
 */
export const ShareCard: React.FC<ShareCardProps> = ({ data }) => {
	return (
		<div
			id="share-card"
			className="w-[1200px] h-[630px] p-16 flex flex-col justify-start text-white relative overflow-hidden"
			style={{
				background: `linear-gradient(135deg, #059669 0%, #0d9488 50%, #0891b2 100%)`,
				fontFamily:
					'var(--font-geist-sans), "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif',
			}}
		>
			{/* 装飾的な背景要素 */}
			<div className="absolute top-[-100px] right-[-100px] w-80 h-80 bg-white/10 rounded-full blur-3xl" />
			<div className="absolute bottom-[-50px] left-[-50px] w-60 h-60 bg-emerald-400/20 rounded-full blur-2xl" />

			{/* ヘッダー */}
			<div className="flex justify-between items-center z-10 mb-14">
				<div>
					<h1 className="text-7xl font-black tracking-tighter mb-1">
						EcoMiles
					</h1>
					<p className="text-xl font-bold opacity-90 tracking-widest text-emerald-100">
						環境貢献レポート
					</p>
				</div>
				<div className="bg-white/20 backdrop-blur-md p-4 px-6 rounded-[2rem] border border-white/30 flex items-center gap-4">
					{data.avatarUrl ? (
						<img
							src={data.avatarUrl}
							alt={data.userName}
							crossOrigin="anonymous"
							className="w-14 h-14 rounded-full border-2 border-emerald-400/50 shadow-inner object-cover"
						/>
					) : (
						<div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center border-2 border-emerald-400/50">
							<span className="text-xl font-black">{data.userName[0]}</span>
						</div>
					)}
					<div>
						<p className="text-[10px] font-black tracking-[0.2em] opacity-60 mb-0.5 uppercase">
							Athlete
						</p>
						<p className="text-2xl font-black tracking-tight">
							{data.userName}
						</p>
					</div>
				</div>
			</div>

			{/* メイングリッド */}
			<div className="grid grid-cols-2 gap-6 z-10 items-stretch mb-10">
				<div className="bg-white/10 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/20 flex flex-col justify-center shadow-inner">
					<div className="flex items-center gap-3 mb-2">
						<div className="p-2.5 bg-emerald-400 rounded-xl text-emerald-900">
							<Leaf size={32} />
						</div>
						<span className="text-xl font-black tracking-wider">CO2削減量</span>
					</div>
					<div className="flex items-baseline gap-3">
						<span className="text-8xl font-black tracking-tighter tabular-nums">
							{data.totalCO2Reduction.toFixed(2)}
						</span>
						<span className="text-4xl font-black opacity-60">kg</span>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-5">
					<div className="bg-white/10 backdrop-blur-md p-6 rounded-[2rem] border border-white/20 shadow-inner flex flex-col justify-center">
						<div className="flex items-center gap-2 mb-2 opacity-70">
							<Snowflake size={20} />
							<span className="text-xs font-black tracking-widest">
								守った氷
							</span>
						</div>
						<div className="flex items-baseline gap-1.5">
							<span className="text-4xl font-black tabular-nums">
								{data.iceSaved.toFixed(1)}
							</span>
							<span className="text-sm font-black opacity-60">kg</span>
						</div>
					</div>

					<div className="bg-white/10 backdrop-blur-md p-6 rounded-[2rem] border border-white/20 shadow-inner flex flex-col justify-center">
						<div className="flex items-center gap-2 mb-2 opacity-70">
							<Trees size={20} />
							<span className="text-xs font-black tracking-widest">
								杉の木換算
							</span>
						</div>
						<div className="flex items-baseline gap-1.5">
							<span className="text-4xl font-black tabular-nums">
								{data.cedarTrees.toFixed(2)}
							</span>
							<span className="text-sm font-black opacity-60">本</span>
						</div>
					</div>

					<div className="bg-white/10 backdrop-blur-md p-6 px-8 rounded-[2rem] border border-white/20 col-span-2 flex items-center justify-between shadow-inner">
						<div>
							<div className="flex items-center gap-2 mb-1 opacity-70">
								<Coins size={20} />
								<span className="text-xs font-black tracking-widest">
									累計獲得ポイント
								</span>
							</div>
							<div className="flex items-baseline gap-2">
								<span className="text-5xl font-black tracking-tighter tabular-nums">
									{data.totalPoints.toLocaleString()}
								</span>
								<span className="text-lg font-black opacity-60">pts</span>
							</div>
						</div>
						<div className="flex gap-5 opacity-20">
							<Bike size={48} />
							<Footprints size={48} />
							<SportShoe size={48} />
						</div>
					</div>
				</div>
			</div>

			{/* フッター */}
			<div className="mt-auto flex justify-between items-end z-10 border-t border-white/20 pt-6">
				<div className="flex flex-col gap-0.5">
					<p className="text-[10px] font-black opacity-40 tracking-[0.2em]">
						一緒に始めよう
					</p>
					<p className="text-xl font-black tracking-tight text-emerald-200/80">
						ecomiles-omega.vercel.app
					</p>
				</div>
				<div className="flex flex-col items-end gap-1.5">
					<p className="text-[11px] font-black opacity-40 tracking-widest uppercase">
						Powered by
					</p>
					<div className="bg-purple-900/40 border border-white/20 p-2.5 px-5 rounded-2xl shadow-lg">
						<span className="text-sm font-black tracking-wider text-purple-100">
							Intervals.icu API
						</span>
					</div>
				</div>
			</div>
		</div>
	);
};
