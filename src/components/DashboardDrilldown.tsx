"use client";

import type { Activity } from "@prisma/client";
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
import { useEffect, useState } from "react";
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
	intervalsConnected?: boolean;
	sidebarTop?: React.ReactNode;
	sidebarBottom?: React.ReactNode;
	wideContent?: React.ReactNode;
}

export const DashboardDrilldown: React.FC<DashboardDrilldownProps> = ({
	dashboardData,
	activities: initialActivities,
	intervalsConnected = false,
	sidebarTop,
	sidebarBottom,
	wideContent,
}) => {
	const [selectedMetric, setSelectedMetric] = useState<MetricType>("co2");
	const [isExpanded, setIsExpanded] = useState(false);
	const [activities, setActivities] = useState<Activity[]>(initialActivities);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [hasMore, setHasMore] = useState(initialActivities.length >= 20);

	// Propsの変更を検知してステートを更新（リアルタイム更新対応）
	useEffect(() => {
		// すでに読み込まれているものがある場合、先頭に新しいものを追加するか、
		// 複雑さを避けるため一旦 initialActivities (最新20件) でリセットする。
		// ここではシンプルに最新の状態を反映させる。
		setActivities(initialActivities);
		setHasMore(initialActivities.length >= 20);
	}, [initialActivities]);

	const displayedActivities = isExpanded ? activities : activities.slice(0, 5);

	const loadMore = async () => {
		setIsLoadingMore(true);
		try {
			const response = await fetch(
				`/api/activities?skip=${activities.length}&take=20`,
			);
			if (response.ok) {
				const newActivities: Activity[] = await response.json();
				if (newActivities.length < 20) {
					setHasMore(false);
				}
				setActivities((prev) => [...prev, ...newActivities]);
			}
		} catch (error) {
			console.error("Failed to load more activities:", error);
		} finally {
			setIsLoadingMore(false);
		}
	};

	const [isSeeding, setIsSeeding] = useState(false);
	const handleDemoSeed = async () => {
		if (
			!confirm(
				"デモデータを生成してダッシュボードの機能を確認しますか？\n(過去180日分のダミーアクティビティが追加されます)",
			)
		)
			return;

		setIsSeeding(true);
		try {
			const response = await fetch("/api/demo/seed", { method: "POST" });
			if (response.ok) {
				window.location.reload();
			} else {
				alert("デモデータの生成に失敗しました。");
			}
		} catch (error) {
			console.error("Demo seed error:", error);
			alert("エラーが発生しました。");
		} finally {
			setIsSeeding(false);
		}
	};

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

			<div className="w-full max-w-5xl mb-12 px-4 md:px-0">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
					{/* 左カラム (2/3): 動的コンテンツ */}
					<div className="lg:col-span-2 space-y-12">
						{/* アクティビティ履歴 */}
						<section>
							<div className="flex items-center justify-between mb-8">
								<div className="flex items-center gap-4">
									<div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
										{getMetricIcon(selectedMetric)}
									</div>
									<h2 className="text-2xl font-black tracking-tight">
										{getMetricTitle(selectedMetric)}
									</h2>
								</div>
								{intervalsConnected && activities.length > 0 && (
									<SyncButton provider="intervals" />
								)}
							</div>

							{activities.length > 0 ? (
								<div className="overflow-hidden border rounded-[2.5rem] shadow-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 transition-all hover:shadow-md">
									{/* テーブル表示 ... */}
									<div className="overflow-x-auto">
										<table className="min-w-full divide-y divide-gray-100 dark:divide-slate-800 text-left">
											<thead className="bg-slate-50 dark:bg-slate-800/50">
												<tr>
													<th className="px-8 py-5 text-[10px] font-black text-slate-400 tracking-[0.2em]">
														日付
													</th>
													<th className="px-8 py-5 text-[10px] font-black text-slate-400 tracking-[0.2em]">
														タイプ
													</th>
													<th className="px-8 py-5 text-[10px] font-black text-slate-400 tracking-[0.2em] text-right">
														距離
													</th>
													<th className="px-8 py-5 text-[10px] font-black text-slate-400 tracking-[0.2em] text-right">
														{selectedMetric === "points"
															? "獲得ポイント"
															: "貢献値"}
													</th>
													<th className="px-8 py-5 text-[10px] font-black text-slate-400 tracking-[0.2em] text-right">
														詳細
													</th>
												</tr>
											</thead>
											<tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-100 dark:divide-slate-800">
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
															const lifespan =
																calculateEarthLifespanExtension(co2);
															if (lifespan < 0.001) {
																contributionValue = (
																	lifespan * 1000000
																).toFixed(1);
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
															contributionValue =
																calculateLEDBulbHours(co2).toFixed(1);
															contributionUnit = "時間";
															break;
														default:
															contributionValue = co2.toFixed(2);
															contributionUnit = "kg";
													}

													return (
														<tr
															key={activity.id}
															className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group"
														>
															<td className="px-8 py-5 whitespace-nowrap text-sm font-bold">
																{formatActivityDate(activity.activityDate)}
															</td>
															<td className="px-8 py-5 whitespace-nowrap text-sm">
																<div className="flex items-center gap-2 font-black">
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
															<td className="px-8 py-5 whitespace-nowrap text-sm font-black text-right">
																{activity.distance.toFixed(2)}
																<span className="text-[10px] ml-1 text-slate-400 font-normal">
																	km
																</span>
															</td>
															<td className="px-8 py-5 whitespace-nowrap text-sm font-black text-emerald-600 dark:text-emerald-400 text-right">
																{contributionValue}
																<span className="text-[10px] ml-1 opacity-70 font-normal">
																	{contributionUnit}
																</span>
															</td>
															<td className="px-8 py-5 whitespace-nowrap text-sm text-right">
																{activity.intervalsActivityId ? (
																	<a
																		href={`https://intervals.icu/activities/${activity.intervalsActivityId}`}
																		target="_blank"
																		rel="noopener noreferrer"
																		className="text-purple-650 hover:underline font-black text-[10px]"
																	>
																		詳細 (Intervals)
																	</a>
																) : activity.stravaActivityId ? (
																	<a
																		href={`https://www.strava.com/activities/${activity.stravaActivityId}`}
																		target="_blank"
																		rel="noopener noreferrer"
																		className="text-[#FC5200] hover:underline font-black text-[10px]"
																	>
																		詳細 (Strava)
																	</a>
																) : (
																	<span className="text-slate-400 text-[10px]">詳細なし</span>
																)}
															</td>
														</tr>
													);
												})}
											</tbody>
										</table>
									</div>

									{activities.length > 5 && (
										<div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-800 flex flex-col items-center gap-4">
											{!isExpanded ? (
												<button
													type="button"
													onClick={() => setIsExpanded(true)}
													className="px-6 py-2 text-xs font-black text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-all tracking-widest"
												>
													表示履歴を増やす
												</button>
											) : (
												<>
													{hasMore && (
														<button
															type="button"
															onClick={loadMore}
															disabled={isLoadingMore}
															className="px-6 py-2 text-xs font-black text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-all tracking-widest flex items-center gap-2"
														>
															{isLoadingMore
																? "読み込み中..."
																: "さらに過去の履歴を読み込む"}
														</button>
													)}
													<button
														type="button"
														onClick={() => setIsExpanded(false)}
														className="px-6 py-2 text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-all tracking-widest"
													>
														表示を減らす
													</button>
												</>
											)}
										</div>
									)}
								</div>
							) : !intervalsConnected ? (
								<div className="p-12 text-center bg-slate-50 dark:bg-slate-900/20 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center gap-8 shadow-sm">
									<div className="p-6 bg-white dark:bg-slate-850 rounded-full shadow-inner">
										<Bike className="w-12 h-12 text-emerald-500 animate-bounce" />
									</div>
									<div className="space-y-4">
										<h3 className="text-2xl font-black text-slate-800 dark:text-slate-200">
											サービスと連携しましょう
										</h3>
										<p className="text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed text-sm">
											アクティビティを同期して、地球への貢献をリアルタイムに可視化しましょう。
										</p>
									</div>
									<div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-md">
										<a
											href="/api/intervals/auth"
											className="flex-1 inline-flex items-center justify-center gap-3 px-6 py-4 bg-purple-650 hover:bg-purple-750 text-white font-black rounded-2xl transition-all transform hover:scale-105 active:scale-95 shadow-md shadow-purple-500/10 text-sm"
										>
											<span className="h-2.5 w-2.5 rounded-full bg-white" />
											Intervals.icuと連携
										</a>
									</div>

									<button
										type="button"
										onClick={handleDemoSeed}
										disabled={isSeeding}
										className="text-slate-600 dark:text-slate-400 font-bold text-xs hover:underline decoration-2 underline-offset-4 disabled:opacity-50"
									>
										{isSeeding ? "生成中..." : "または、デモモードで機能を試す"}
									</button>
								</div>
							) : (
								<div className="p-20 text-center bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-slate-100 dark:border-slate-800 shadow-sm">
									<p className="text-slate-400 font-bold">
										履歴データがありません。アクティビティを同期してください。
									</p>
								</div>
							)}
						</section>

						{/* ワイドコンテンツ (例: みんなの貢献) */}
						{wideContent && <section>{wideContent}</section>}
					</div>

					{/* 右カラム (1/3): 静的コンテンツ */}
					<div className="lg:col-span-1 space-y-12 sticky top-8">
						{sidebarTop}
						{sidebarBottom}
					</div>
				</div>
			</div>
		</div>
	);
};
