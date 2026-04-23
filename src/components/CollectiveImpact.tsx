import React from "react";
import { Trees, IceCream, Leaf, Zap } from "lucide-react";

interface CollectiveImpactProps {
	data: {
		totalActivities: number;
		totalCO2Reduction: number;
		iceSaved: number;
		cedarTrees: number;
	};
}

export const CollectiveImpactDisplay = ({ data }: CollectiveImpactProps) => {
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
						<span className="text-emerald-300 text-sm uppercase tracking-wider font-bold mb-1">
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
						<span className="text-emerald-300 text-sm uppercase tracking-wider font-bold mb-1">
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
						<span className="text-emerald-300 text-sm uppercase tracking-wider font-bold mb-1">
							杉の木換算
						</span>
						<span className="text-3xl font-black">
							{data.cedarTrees.toFixed(2)}{" "}
							<small className="text-sm font-normal opacity-70">本分</small>
						</span>
					</div>

					<div className="flex flex-col items-center lg:items-start">
						<div className="bg-emerald-800 p-3 rounded-2xl mb-4">
							<IceCream className="text-cyan-400" />
						</div>
						<span className="text-emerald-300 text-sm uppercase tracking-wider font-bold mb-1">
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
