"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EcoMetricCard from "@/components/EcoMetricCard";
import { ThermometerSun, IceCream, Coins, Leaf } from "lucide-react";

interface RealtimeDashboardProps {
	initialData: {
		totalPoints: number;
		totalCO2Reduction: number;
		lifespanExtension: number;
		iceSaved: number;
	};
}

export default function RealtimeDashboard({ initialData }: RealtimeDashboardProps) {
	const router = useRouter();
	const [data, setData] = useState(initialData);

	// サーバーサイドからのデータ変更を反映
	useEffect(() => {
		setData(initialData);
	}, [initialData]);

	// 背景での自動更新（ポーリング）
	// Webhookで裏側でデータが更新された場合でも、30秒ごとに画面をリフレッシュしてアニメーションさせる
	useEffect(() => {
		const interval = setInterval(() => {
			router.refresh();
		}, 30000); // 30秒ごとに更新チェック

		return () => clearInterval(interval);
	}, [router]);

	return (
		<div className="w-full max-w-5xl">
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
				<EcoMetricCard
					title="現在のポイント"
					value={data.totalPoints}
					unit="pts"
					icon={<Coins className="text-green-600 w-5 h-5" />}
					className="bg-green-50 border-green-200"
					titleClassName="text-green-800"
					valueClassName="text-green-900"
				/>

				<EcoMetricCard
					title="CO2削減貢献度"
					value={data.totalCO2Reduction}
					unit="kg"
					precision={2}
					icon={<Leaf className="text-emerald-600 w-5 h-5" />}
					className="bg-emerald-50 border-emerald-200"
					titleClassName="text-emerald-800"
					valueClassName="text-emerald-900"
				/>

				<EcoMetricCard
					title="地球の寿命を延ばした"
					value={data.lifespanExtension < 0.001 ? data.lifespanExtension * 1000000 : data.lifespanExtension}
					unit={data.lifespanExtension < 0.001 ? "μ秒" : "秒"}
					precision={data.lifespanExtension < 0.001 ? 2 : 6}
					icon={<ThermometerSun className="text-orange-600 w-5 h-5" />}
					className="bg-orange-50 border-orange-200"
					titleClassName="text-orange-800"
					valueClassName="text-orange-900"
					description="※1℃上昇までの時間を推計"
				/>

				<EcoMetricCard
					title="北極の氷を守った"
					value={data.iceSaved}
					unit="kg"
					precision={2}
					icon={<IceCream className="text-cyan-600 w-5 h-5" />}
					className="bg-cyan-50 border-cyan-200"
					titleClassName="text-cyan-800"
					valueClassName="text-cyan-900"
					description="※CO2削減量から融解阻止量を推計"
				/>
			</div>
		</div>
	);
}
