"use client";

import {
	Coins,
	Leaf,
	Lightbulb,
	Smartphone,
	Snowflake,
	ThermometerSun,
	Trees,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import EcoMetricCard from "@/components/EcoMetricCard";

export type MetricType =
	| "points"
	| "co2"
	| "lifespan"
	| "ice"
	| "cedar"
	| "smartphone"
	| "led";

export interface DashboardData {
	totalPoints: number;
	totalCO2Reduction: number;
	lifespanExtension: number;
	iceSaved: number;
	cedarTrees: number;
	smartphoneCharges: number;
	ledBulbHours: number;
}

interface RealtimeDashboardProps {
	initialData: DashboardData;
	onMetricSelect?: (metric: MetricType) => void;
	selectedMetric?: MetricType;
}

export default function RealtimeDashboard({
	initialData,
	onMetricSelect,
	selectedMetric,
}: RealtimeDashboardProps) {
	const router = useRouter();

	// 背景での自動更新（ポーリング）
	useEffect(() => {
		const interval = setInterval(() => {
			router.refresh();
		}, 30000); // 30秒ごとに更新チェック

		return () => clearInterval(interval);
	}, [router]);

	const handleMetricClick = (metric: MetricType) => {
		if (onMetricSelect) {
			onMetricSelect(metric);
		}
	};

	return (
		<div className="w-full max-w-5xl">
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
				<EcoMetricCard
					title="獲得ポイント"
					value={initialData.totalPoints}
					unit="pts"
					icon={<Coins className="text-green-600 w-5 h-5" />}
					className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900 shadow-sm"
					titleClassName="text-green-800 dark:text-green-400"
					valueClassName="text-green-900 dark:text-green-200"
					onClick={() => handleMetricClick("points")}
					isActive={selectedMetric === "points"}
				/>

				<EcoMetricCard
					title="CO2削減量"
					value={initialData.totalCO2Reduction}
					unit="kg"
					precision={2}
					icon={<Leaf className="text-emerald-600 w-5 h-5" />}
					className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 shadow-sm"
					titleClassName="text-emerald-800 dark:text-emerald-400"
					valueClassName="text-emerald-900 dark:text-emerald-200"
					onClick={() => handleMetricClick("co2")}
					isActive={selectedMetric === "co2"}
				/>

				<EcoMetricCard
					title="地球の寿命を延ばした"
					value={
						initialData.lifespanExtension < 0.001
							? initialData.lifespanExtension * 1000000
							: initialData.lifespanExtension
					}
					unit={initialData.lifespanExtension < 0.001 ? "μ秒" : "秒"}
					precision={initialData.lifespanExtension < 0.001 ? 2 : 6}
					icon={<ThermometerSun className="text-orange-600 w-5 h-5" />}
					className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900 shadow-sm"
					titleClassName="text-orange-800 dark:text-orange-400"
					valueClassName="text-orange-900 dark:text-orange-200"
					description="※1℃上昇までの時間を推計"
					onClick={() => handleMetricClick("lifespan")}
					isActive={selectedMetric === "lifespan"}
				/>

				<EcoMetricCard
					title="守った氷の量"
					value={initialData.iceSaved}
					unit="kg"
					precision={2}
					icon={<Snowflake className="text-cyan-600 w-5 h-5" />}
					className="bg-cyan-50 dark:bg-cyan-950/20 border-cyan-200 dark:border-cyan-900 shadow-sm"
					titleClassName="text-cyan-800 dark:text-cyan-400"
					valueClassName="text-cyan-900 dark:text-cyan-200"
					description="※融解阻止量を推計"
					onClick={() => handleMetricClick("ice")}
					isActive={selectedMetric === "ice"}
				/>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
				<EcoMetricCard
					title="杉の木に換算"
					value={initialData.cedarTrees}
					unit="本"
					precision={4}
					icon={<Trees className="text-green-700 w-5 h-5" />}
					className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 shadow-sm"
					description="※杉の木1本の年間吸収量"
					onClick={() => handleMetricClick("cedar")}
					isActive={selectedMetric === "cedar"}
				/>

				<EcoMetricCard
					title="スマホ充電回数"
					value={initialData.smartphoneCharges}
					unit="回"
					precision={0}
					icon={<Smartphone className="text-blue-600 w-5 h-5" />}
					className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 shadow-sm"
					description="※フル充電1回のCO2排出量"
					onClick={() => handleMetricClick("smartphone")}
					isActive={selectedMetric === "smartphone"}
				/>

				<EcoMetricCard
					title="LED電球点灯時間"
					value={initialData.ledBulbHours}
					unit="時間"
					precision={1}
					icon={<Lightbulb className="text-yellow-500 w-5 h-5" />}
					className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 shadow-sm"
					description="※LED電球(10W)の連続使用"
					onClick={() => handleMetricClick("led")}
					isActive={selectedMetric === "led"}
				/>
			</div>
		</div>
	);
}
