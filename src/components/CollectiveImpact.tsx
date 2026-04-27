import { Leaf, Snowflake, Trees, Zap } from "lucide-react";

interface CollectiveImpactProps {
	data: {
		totalActivities: number;
		totalCO2Reduction: number;
		iceSaved: number;
		cedarTrees: number;
	};
	userCO2Reduction?: number;
}

export const CollectiveImpactCard = ({
	data,
	userCO2Reduction,
}: CollectiveImpactProps) => {
	// 自分の貢献割合を計算
	const hasUserContribution = typeof userCO2Reduction === "number";
	const contributionPercentage =
		hasUserContribution && data.totalCO2Reduction > 0
			? Math.min((userCO2Reduction / data.totalCO2Reduction) * 100, 100)
			: 0;

	// ドーナツチャート用の計算
	const radius = 40;
	const circumference = 2 * Math.PI * radius;
	const offset = circumference - (contributionPercentage / 100) * circumference;

	return (
		<div className="lg:col-span-2 p-10 bg-emerald-600 dark:bg-emerald-900/40 text-white rounded-[3rem] shadow-xl shadow-emerald-500/10 border border-emerald-500/20 overflow-hidden relative group">
			{/* 背景の装飾用アイコン */}
			<div className="absolute -bottom-10 -left-10 text-white/5 transform -rotate-12 group-hover:scale-110 transition-transform duration-700">
				<Trees size={240} />
			</div>

			<div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
				{/* 左側: 統計数値 */}
				<div className="flex-1 w-full">
					<div className="flex items-center gap-4 mb-8">
						<div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner">
							<Leaf size={24} className="text-emerald-100" />
						</div>
						<div>
							<h2 className="text-2xl font-black tracking-tight leading-none mb-1">
								みんなの貢献
							</h2>
							<p className="text-emerald-100/60 text-xs font-bold uppercase tracking-widest">
								Collective Impact
							</p>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-x-8 gap-y-8">
						<div className="space-y-1">
							<div className="flex items-center gap-2 text-emerald-100/60 text-[10px] font-black uppercase tracking-[0.2em]">
								<Zap size={12} />
								活動件数
							</div>
							<div className="text-3xl font-black tabular-nums">
								{data.totalActivities.toLocaleString()}
								<span className="text-xs ml-2 font-bold opacity-60">回</span>
							</div>
						</div>

						<div className="space-y-1">
							<div className="flex items-center gap-2 text-emerald-100/60 text-[10px] font-black uppercase tracking-[0.2em]">
								<Leaf size={12} />
								CO2削減量
							</div>
							<div className="text-3xl font-black tabular-nums">
								{data.totalCO2Reduction.toFixed(1)}
								<span className="text-xs ml-2 font-bold opacity-60">kg</span>
							</div>
						</div>

						<div className="space-y-1">
							<div className="flex items-center gap-2 text-emerald-100/60 text-[10px] font-black uppercase tracking-[0.2em]">
								<Trees size={12} />
								杉の木換算
							</div>
							<div className="text-3xl font-black tabular-nums">
								{data.cedarTrees.toFixed(1)}
								<span className="text-xs ml-2 font-bold opacity-60">本</span>
							</div>
						</div>

						<div className="space-y-1">
							<div className="flex items-center gap-2 text-emerald-100/60 text-[10px] font-black uppercase tracking-[0.2em]">
								<Snowflake size={12} />
								守った氷
							</div>
							<div className="text-3xl font-black tabular-nums">
								{data.iceSaved.toFixed(1)}
								<span className="text-xs ml-2 font-bold opacity-60">kg</span>
							</div>
						</div>
					</div>
				</div>

				{/* 右側: あなたの貢献度グラフ */}
				{hasUserContribution && (
					<div className="flex flex-col items-center bg-emerald-950/20 p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-sm min-w-[240px]">
						<div className="relative w-32 h-32 mb-6">
							{/* 背景の円 */}
							<svg
								className="w-full h-full transform -rotate-90"
								role="img"
								aria-labelledby="contribution-chart-title"
							>
								<title id="contribution-chart-title">
									あなたの寄与度チャート
								</title>
								<circle
									cx="64"
									cy="64"
									r={radius}
									stroke="currentColor"
									strokeWidth="8"
									fill="transparent"
									className="text-white/10"
								/>
								{/* プログレス円 */}
								<circle
									cx="64"
									cy="64"
									r={radius}
									stroke="currentColor"
									strokeWidth="8"
									fill="transparent"
									strokeDasharray={circumference}
									strokeDashoffset={offset}
									strokeLinecap="round"
									className="text-white transition-all duration-1000 ease-out"
								/>
							</svg>
							<div className="absolute inset-0 flex flex-col items-center justify-center">
								<span className="text-xl font-black leading-none">
									{contributionPercentage < 0.1 && contributionPercentage > 0
										? "< 0.1"
										: contributionPercentage.toFixed(1)}
									<small className="text-[10px] ml-0.5">%</small>
								</span>
							</div>
						</div>
						<div className="text-center">
							<h3 className="text-sm font-black mb-1">あなたの寄与度</h3>
							<p className="text-[10px] text-emerald-100/60 font-bold leading-relaxed">
								全体のCO2削減量に対する
								<br />
								あなたの貢献割合です
							</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export const CollectiveImpactDisplay = ({
	data,
	userCO2Reduction,
}: CollectiveImpactProps) => {
	return (
		<div className="w-full py-12 bg-emerald-900 text-emerald-50 rounded-3xl overflow-hidden relative shadow-2xl mb-16">
			<div className="absolute top-0 right-0 p-8 opacity-10">
				<Trees size={200} />
			</div>

			<div className="relative z-10 px-8 lg:px-12 text-center lg:text-left">
				<h2 className="text-3xl lg:text-4xl font-extrabold mb-4">
					みんなで地球を守ろう
				</h2>
				<p className="text-emerald-200 mb-12 text-lg max-w-2xl">
					EcoMilesユーザー全員の活動が、
					<br />
					これだけのポジティブな変化を世界にもたらしています。
				</p>

				<div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
					<div className="flex flex-col items-center lg:items-start">
						<div className="bg-emerald-800 p-3 rounded-2xl mb-4">
							<Zap className="text-yellow-400" />
						</div>
						<span className="text-emerald-300 text-sm tracking-wider font-bold mb-1">
							活動件数
						</span>
						<span className="text-3xl font-black">
							{data.totalActivities.toLocaleString()}{" "}
							<small className="text-sm font-normal opacity-70">回</small>
						</span>
					</div>

					<div className="flex flex-col items-center lg:items-start">
						<div className="bg-emerald-800 p-3 rounded-2xl mb-4">
							<Leaf className="text-emerald-400" />
						</div>
						<span className="text-emerald-300 text-sm tracking-wider font-bold mb-1">
							CO2削減量
						</span>
						<span className="text-3xl font-black">
							{data.totalCO2Reduction.toFixed(1)}{" "}
							<small className="text-sm font-normal opacity-70">kg</small>
						</span>
					</div>

					<div className="flex flex-col items-center lg:items-start">
						<div className="bg-emerald-800 p-3 rounded-2xl mb-4">
							<Trees className="text-green-400" />
						</div>
						<span className="text-emerald-300 text-sm tracking-wider font-bold mb-1">
							杉の木換算
						</span>
						<span className="text-3xl font-black">
							{data.cedarTrees.toFixed(2)}{" "}
							<small className="text-sm font-normal opacity-70">本分</small>
						</span>
					</div>

					<div className="flex flex-col items-center lg:items-start">
						<div className="bg-emerald-800 p-3 rounded-2xl mb-4">
							<Snowflake className="text-cyan-400" />
						</div>
						<span className="text-emerald-300 text-sm tracking-wider font-bold mb-1">
							守った氷
						</span>
						<span className="text-3xl font-black">
							{data.iceSaved.toFixed(1)}{" "}
							<small className="text-sm font-normal opacity-70">kg</small>
						</span>
					</div>
				</div>
			</div>
		</div>
	);
};
