"use client";

import type { Activity, Point } from "@prisma/client";
import {
	Bike,
	Coins,
	Footprints,
	History,
	Leaf,
	Lightbulb,
	Smartphone,
	Snowflake,
	SportShoe,
	ThermometerSun,
	Trees,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import {
	calculateCedarTreeEquivalent,
	calculateCO2Reduction,
	calculateEarthLifespanExtension,
	calculateIceMeltingPrevention,
	calculateLEDBulbHours,
	calculateSmartphoneCharges,
} from "@/lib/eco-utils";
import { formatActivityDate } from "@/lib/utils";
import RealtimeDashboard, {
	type DashboardData,
	type MetricType,
} from "./RealtimeDashboard";
import { SyncButton } from "./SyncButton";

interface DashboardDrilldownProps {
	dashboardData: DashboardData;
	activities: Activity[];
	points: Point[];
	stravaConnected: boolean;
}

export const DashboardDrilldown: React.FC<DashboardDrilldownProps> = ({
	dashboardData,
	activities,
	points,
	stravaConnected,
}) => {
	const [selectedMetric, setSelectedMetric] = useState<MetricType>("co2");
	const [isExpanded, setIsExpanded] = useState(false);

	const displayedActivities = isExpanded ? activities : activities.slice(0, 5);

	const getMetricTitle = (metric: MetricType) => {
		switch (metric) {
			case "points":
				return "獲得ポイント履歴";
			case "co2":
				return "CO2削減履歴";
			case "lifespan":
				return "地球寿命への貢献履歴";
			case "ice":
				return "氷の融解阻止履歴";
			case "cedar":
				return "杉の木換算履歴";
			case "smartphone":
				return "スマホ充電換算履歴";
			case "led":
				return "LED点灯時間換算履歴";
			default:
				return "最近のアクティビティ";
		}
	};

	const getMetricIcon = (metric: MetricType) => {
		switch (metric) {
			case "points":
				return <Coins className="text-green-600" />;
			case "co2":
				return <Leaf className="text-emerald-600" />;
			case "lifespan":
				return <ThermometerSun className="text-orange-600" />;
			case "ice":
				return <Snowflake className="text-cyan-600" />;
			case "cedar":
				return <Trees className="text-green-700" />;
			case "smartphone":
				return <Smartphone className="text-blue-600" />;
			case "led":
				return <Lightbulb className="text-yellow-500" />;
			default:
				return <History />;
		}
	};

	return (
		<div className="w-full flex flex-col items-center">
			<RealtimeDashboard
				initialData={dashboardData}
				selectedMetric={selectedMetric}
				onMetricSelect={setSelectedMetric}
			/>

			<div className="w-full max-w-5xl mb-12">
				<div className="flex items-center justify-between mb-6">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
							{getMetricIcon(selectedMetric)}
						</div>
						<h2 className="text-2xl font-black">
							{getMetricTitle(selectedMetric)}
						</h2>
					</div>
					{stravaConnected && <SyncButton />}
				</div>

				{activities.length > 0 ? (
					<div className="overflow-x-auto border rounded-3xl shadow-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 transition-all overflow-hidden">
						<table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800 text-left">
							<thead className="bg-slate-50 dark:bg-slate-800/50">
								<tr>
									<th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
										日付
									</th>
									<th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
										タイプ
									</th>
									<th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">
										距離
									</th>
									<th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">
										{selectedMetric === "points" ? "獲得ポイント" : "貢献値"}
									</th>
									<th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">
										詳細
									</th>
								</tr>
							</thead>
							<tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-800">
								{displayedActivities.map((activity) => {
									let contributionValue = "";
									let contributionUnit = "";
									const co2 = calculateCO2Reduction(activity.distance);

									switch (selectedMetric) {
										case "points":
											contributionValue = `+${activity.pointsAwarded}`;
											contributionUnit = "pts";
											break;
										case "co2":
											contributionValue = co2.toFixed(2);
											contributionUnit = "kg";
											break;
										case "lifespan": {
											const lifespan = calculateEarthLifespanExtension(co2);
											if (lifespan < 0.001) {
												contributionValue = (lifespan * 1000000).toFixed(1);
												contributionUnit = "μ秒";
											} else {
												contributionValue = lifespan.toFixed(4);
												contributionUnit = "秒";
											}
											break;
										}
										case "ice":
											contributionValue =
												calculateIceMeltingPrevention(co2).toFixed(2);
											contributionUnit = "kg";
											break;
										case "cedar":
											contributionValue =
												calculateCedarTreeEquivalent(co2).toFixed(4);
											contributionUnit = "本";
											break;
										case "smartphone":
											contributionValue =
												calculateSmartphoneCharges(co2).toFixed(0);
											contributionUnit = "回";
											break;
										case "led":
											contributionValue = calculateLEDBulbHours(co2).toFixed(1);
											contributionUnit = "時間";
											break;
										default:
											contributionValue = co2.toFixed(2);
											contributionUnit = "kg";
									}

									return (
										<tr
											key={activity.id}
											className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
										>
											<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
												{formatActivityDate(activity.activityDate)}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm">
												<div className="flex items-center gap-2 font-bold">
													{activity.activityType === "Ride" && (
														<Bike className="w-4 h-4 text-orange-500" />
													)}
													{activity.activityType === "Walk" && (
														<Footprints className="w-4 h-4 text-emerald-500" />
													)}
													{activity.activityType === "Run" && (
														<SportShoe className="w-4 h-4 text-blue-500" />
													)}
													{activity.activityType}
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right">
												{activity.distance.toFixed(2)}
												<span className="text-[10px] ml-1 text-slate-400 font-normal">
													km
												</span>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm font-black text-emerald-600 dark:text-emerald-400 text-right">
												{contributionValue}
												<span className="text-[10px] ml-1 opacity-70 font-normal">
													{contributionUnit}
												</span>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-right">
												<a
													href={`https://www.strava.com/activities/${activity.stravaActivityId}`}
													target="_blank"
													rel="noopener noreferrer"
													className="text-[#FC5200] hover:underline font-black text-[10px] uppercase"
												>
													View
												</a>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>

						{activities.length > 5 && (
							<div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-center">
								<button
									type="button"
									onClick={() => setIsExpanded(!isExpanded)}
									className="text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-colors flex items-center gap-1"
								>
									{isExpanded
										? "表示を減らす"
										: `すべての履歴を表示 (${activities.length}件)`}
								</button>
							</div>
						)}
					</div>
				) : (
					<div className="p-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
						<p className="text-slate-500 font-bold">履歴データがありません。</p>
					</div>
				)}
			</div>
		</div>
	);
};
