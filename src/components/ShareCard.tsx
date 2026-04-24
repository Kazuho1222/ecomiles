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
import { StravaLogo } from "./StravaLogo";

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
			className="w-[1200px] h-[630px] p-12 flex flex-col justify-between text-white font-sans relative overflow-hidden"
			style={{
				background: `linear-gradient(135deg, #059669 0%, #0d9488 50%, #0891b2 100%)`,
			}}
		>
			{/* 装飾的な背景要素 */}
			<div className="absolute top-[-100px] right-[-100px] w-80 h-80 bg-white/10 rounded-full blur-3xl" />
			<div className="absolute bottom-[-50px] left-[-50px] w-60 h-60 bg-emerald-400/20 rounded-full blur-2xl" />

			<div className="flex justify-between items-start z-10">
				<div>
					<h1 className="text-6xl font-black tracking-tighter mb-2 italic">
						EcoMiles
					</h1>
					<p className="text-xl font-medium opacity-90 uppercase tracking-widest">
						Your Environmental Impact Report
					</p>
				</div>
				<div className="bg-white/20 backdrop-blur-md p-5 rounded-3xl border border-white/30 flex items-center gap-5">
					{data.avatarUrl ? (
						<img
							src={data.avatarUrl}
							alt={data.userName}
							crossOrigin="anonymous"
							className="w-16 h-16 rounded-full border-2 border-white/50 shadow-inner object-cover"
						/>
					) : (
						<div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/50">
							<span className="text-2xl font-black">{data.userName[0]}</span>
						</div>
					)}
					<div>
						<p className="text-sm font-bold uppercase tracking-widest opacity-70 mb-0.5">
							Athlete
						</p>
						<p className="text-3xl font-black tracking-tight">
							{data.userName}
						</p>
					</div>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-8 z-10">
				<div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20 flex flex-col justify-center">
					<div className="flex items-center gap-4 mb-4">
						<div className="p-3 bg-emerald-400 rounded-xl">
							<Leaf size={32} />
						</div>
						<span className="text-2xl font-bold uppercase tracking-wide">
							CO2 Reduced
						</span>
					</div>
					<div className="flex items-baseline gap-3">
						<span className="text-8xl font-black tracking-tighter">
							{data.totalCO2Reduction.toFixed(2)}
						</span>
						<span className="text-4xl font-bold opacity-80">kg</span>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-6">
					<div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20">
						<div className="flex items-center gap-3 mb-2 opacity-80">
							<Snowflake size={20} />
							<span className="text-sm font-bold uppercase tracking-wider">
								Ice Saved
							</span>
						</div>
						<div className="flex items-baseline gap-1">
							<span className="text-4xl font-black">
								{data.iceSaved.toFixed(1)}
							</span>
							<span className="text-lg font-bold opacity-70">kg</span>
						</div>
					</div>

					<div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20">
						<div className="flex items-center gap-3 mb-2 opacity-80">
							<Trees size={20} />
							<span className="text-sm font-bold uppercase tracking-wider">
								Cedar Trees
							</span>
						</div>
						<div className="flex items-baseline gap-1">
							<span className="text-4xl font-black">
								{data.cedarTrees.toFixed(2)}
							</span>
							<span className="text-lg font-bold opacity-70">trees/yr</span>
						</div>
					</div>

					<div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 col-span-2 flex items-center justify-between">
						<div>
							<div className="flex items-center gap-3 mb-1 opacity-80">
								<Coins size={20} />
								<span className="text-sm font-bold uppercase tracking-wider">
									Total Points
								</span>
							</div>
							<span className="text-5xl font-black tracking-tighter">
								{data.totalPoints}
							</span>
						</div>
						<div className="flex gap-4 opacity-40">
							<Bike size={40} />
							<Footprints size={40} />
							<SportShoe size={40} />
						</div>
					</div>
				</div>
			</div>

			<div className="flex justify-between items-end z-10 border-t border-white/20 pt-8">
				<div className="flex flex-col gap-1">
					<p className="text-sm font-bold opacity-60">Join the movement at</p>
					<p className="text-2xl font-black tracking-tight">
						ecomiles-omega.vercel.app
					</p>
				</div>
				<div className="flex flex-col items-end gap-2">
					<p className="text-xs font-bold opacity-50">Powered by</p>
					<div className="bg-white p-2 rounded-lg">
						<StravaLogo color="#FC5200" width={100} />
					</div>
				</div>
			</div>
		</div>
	);
};
