"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bike, Calendar, Footprints, SportShoe } from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";

interface ActivityCalendarProps {
	stats: Record<string, { total: number; types: Record<string, number> }>;
}

export const ActivityCalendar: React.FC<ActivityCalendarProps> = ({
	stats,
}) => {
	const [hoveredDay, setHoveredDay] = useState<{
		key: string;
		date: Date;
		distance: number;
		types: Record<string, number>;
		x: number;
		y: number;
	} | null>(null);

	// 過去6ヶ月分の日付リストを生成
	const days = useMemo(() => {
		const result = [];
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		for (let i = 181; i >= 0; i--) {
			const d = new Date(today);
			d.setDate(d.getDate() - i);
			// サーバー側と一致させるため、JST基準でYYYY-MM-DD形式のキーを生成
			const dateKey = d.toLocaleDateString("sv-SE", {
				timeZone: "Asia/Tokyo",
			});
			const dayStats = stats[dateKey] || { total: 0, types: {} };
			result.push({
				date: d,
				key: dateKey,
				distance: dayStats.total,
				types: dayStats.types,
			});
		}
		return result;
	}, [stats]);

	const weeks = useMemo(() => {
		const result = [];
		let currentWeek = [];
		const firstDayOffset = (days[0].date.getDay() + 6) % 7;
		for (let i = 0; i < firstDayOffset; i++) {
			currentWeek.push(null);
		}
		for (const day of days) {
			currentWeek.push(day);
			if (currentWeek.length === 7) {
				result.push(currentWeek);
				currentWeek = [];
			}
		}
		if (currentWeek.length > 0) {
			while (currentWeek.length < 7) {
				currentWeek.push(null);
			}
			result.push(currentWeek);
		}
		return result;
	}, [days]);

	const getColor = (distance: number) => {
		if (distance === 0) return "bg-slate-100 dark:bg-slate-800/50";
		if (distance < 5) return "bg-emerald-200 dark:bg-emerald-900/40";
		if (distance < 15) return "bg-emerald-400 dark:bg-emerald-700/60";
		if (distance < 30) return "bg-emerald-500 dark:bg-emerald-500/80";
		return "bg-emerald-600 dark:bg-emerald-400";
	};

	const monthLabels = useMemo(() => {
		const labels: { label: string; index: number }[] = [];
		let lastMonth = -1;
		let lastIndex = -1;
		weeks.forEach((week, i) => {
			const firstDayOfWeek = week.find((d) => d !== null);
			if (firstDayOfWeek && firstDayOfWeek.date.getMonth() !== lastMonth) {
				if (i - lastIndex >= 3) {
					lastMonth = firstDayOfWeek.date.getMonth();
					lastIndex = i;
					labels.push({
						label: firstDayOfWeek.date.toLocaleDateString("ja-JP", {
							month: "short",
							timeZone: "Asia/Tokyo",
						}),
						index: i,
					});
				}
			}
		});
		return labels;
	}, [weeks]);

	return (
		<div className="p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
			<div className="flex items-center gap-3 mb-8">
				<div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
					<Calendar
						size={18}
						className="text-emerald-600 dark:text-emerald-400"
					/>
				</div>
				<h3 className="text-lg font-black tracking-tight">
					アクティビティ・カレンダー
				</h3>
				<span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-auto">
					Last 6 Months
				</span>
			</div>

			<div className="flex flex-col">
				<div className="flex gap-1 justify-start overflow-x-auto pb-2 scrollbar-hide">
					{/* 曜日ラベル */}
					<div className="flex flex-col gap-1 text-[8px] font-bold text-slate-300 w-7 shrink-0 pt-[22px]">
						<div className="h-2.5"></div>
						<div className="h-2.5">火</div>
						<div className="h-2.5"></div>
						<div className="h-2.5">木</div>
						<div className="h-2.5"></div>
						<div className="h-2.5">土</div>
						<div className="h-2.5"></div>
					</div>

					<div className="flex flex-col gap-2 relative">
						{/* 月ラベル */}
						<div className="flex h-4 relative z-0">
							{monthLabels.map((m) => (
								<div
									key={`${m.label}-${m.index}`}
									className="absolute text-[10px] font-bold text-slate-400 whitespace-nowrap"
									style={{ left: `${m.index * 14}px` }}
								>
									{m.label}
								</div>
							))}
						</div>

						{/* 週のグリッド */}
						<div className="flex gap-1 relative z-10">
							{weeks.map((week, weekIndex) => {
								const firstDayInWeek = week.find((d) => d !== null);
								const weekKey = firstDayInWeek
									? `week-${firstDayInWeek.key}`
									: `week-padding-${weekIndex}`;

								return (
									<div key={weekKey} className="flex flex-col gap-1">
										{week.map((day, dayIndex) => {
											const dayKey = day
												? day.key
												: `empty-day-${weekKey}-${dayIndex}`;

											const ariaLabel = day
												? `${day.date.toLocaleDateString("ja-JP", { month: "short", day: "numeric" })}: ${day.distance.toFixed(1)}km`
												: undefined;

											return (
												<div
													key={dayKey}
													role="img"
													aria-label={ariaLabel}
													onMouseEnter={(e) => {
														if (!day) return;
														const rect =
															e.currentTarget.getBoundingClientRect();
														setHoveredDay({
															...day,
															x: rect.left + rect.width / 2,
															y: rect.top,
														});
													}}
													onMouseLeave={() => setHoveredDay(null)}
													className={`w-2.5 h-2.5 rounded-[2px] transition-all hover:scale-150 hover:z-20 cursor-pointer ${
														day ? getColor(day.distance) : "opacity-0"
													}`}
												/>
											);
										})}
									</div>
								);
							})}
						</div>
					</div>
				</div>

				<div className="flex items-center gap-2 mt-4 ml-auto">
					<span className="text-[10px] font-bold text-slate-400 tracking-tight">
						Less activity
					</span>
					<div className="flex gap-1">
						<div className="w-2.5 h-2.5 rounded-[2px] bg-slate-100 dark:bg-slate-800/50" />
						<div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-200 dark:bg-emerald-900/40" />
						<div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-400 dark:bg-emerald-700/60" />
						<div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500 dark:bg-emerald-500/80" />
						<div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-600 dark:bg-emerald-400" />
					</div>
					<span className="text-[10px] font-bold text-slate-400 tracking-tight">
						More activity
					</span>
				</div>
			</div>

			{/* ツールチップ (Fixed: コンテナの制約を受けず常に最前面) */}
			<AnimatePresence>
				{hoveredDay && (
					<motion.div
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.95 }}
						className="fixed z-9999 pointer-events-none"
						style={{
							left: hoveredDay.x,
							top: hoveredDay.y,
							translateX: "-50%",
							translateY: "-100%",
						}}
					>
						<div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-3 rounded-2xl shadow-2xl text-[10px] whitespace-nowrap flex flex-col items-center gap-2 border border-white/10 dark:border-slate-200 min-w-[110px] mb-3 relative">
							<div className="flex flex-col items-center">
								<span className="font-bold opacity-60">
									{hoveredDay.date.toLocaleDateString("ja-JP", {
										month: "short",
										day: "numeric",
										weekday: "short",
										timeZone: "Asia/Tokyo",
									})}
								</span>
								<span className="text-base font-black">
									{hoveredDay.distance.toFixed(1)}
									<small className="ml-0.5 font-bold opacity-70 italic">
										km
									</small>
								</span>
							</div>

							{Object.keys(hoveredDay.types).length > 0 && (
								<div className="flex gap-3 pt-2 border-t border-white/10 dark:border-slate-100 w-full justify-center">
									{hoveredDay.types.Ride && (
										<div className="flex items-center gap-1">
											<Bike size={12} className="text-orange-500" />
											<span className="font-black">
												{hoveredDay.types.Ride.toFixed(1)}
											</span>
										</div>
									)}
									{hoveredDay.types.Run && (
										<div className="flex items-center gap-1">
											<SportShoe size={12} className="text-blue-500" />
											<span className="font-black">
												{hoveredDay.types.Run.toFixed(1)}
											</span>
										</div>
									)}
									{hoveredDay.types.Walk && (
										<div className="flex items-center gap-1">
											<Footprints size={12} className="text-emerald-500" />
											<span className="font-black">
												{hoveredDay.types.Walk.toFixed(1)}
											</span>
										</div>
									)}
								</div>
							)}
							{/* 吹き出しの三角形 */}
							<div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 dark:bg-white rotate-45 border-r border-b border-white/10 dark:border-slate-200" />
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};
