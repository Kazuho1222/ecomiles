"use client";

import { Calendar } from "lucide-react";
import type React from "react";
import { useMemo } from "react";

interface ActivityCalendarProps {
	stats: Record<string, number>;
}

export const ActivityCalendar: React.FC<ActivityCalendarProps> = ({
	stats,
}) => {
	// 過去6ヶ月分の日付リストを生成
	const days = useMemo(() => {
		const result = [];
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		// 26週間分（約6ヶ月）遡る
		for (let i = 181; i >= 0; i--) {
			const d = new Date(today);
			d.setDate(d.getDate() - i);
			const dateKey = d.toISOString().split("T")[0];
			result.push({
				date: d,
				key: dateKey,
				distance: stats[dateKey] || 0,
			});
		}
		return result;
	}, [stats]);

	// 曜日ごとのグリッド（GitHub風）
	const weeks = useMemo(() => {
		const result = [];
		let currentWeek = [];

		// 最初の週のパディング（月曜始まりを想定）
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
				// 前のラベルから2週間（14px * 2 = 28px）以上離れている場合のみ追加
				// これにより文字列の重なりを防ぐ
				if (i - lastIndex >= 3) {
					lastMonth = firstDayOfWeek.date.getMonth();
					lastIndex = i;
					labels.push({
						label: firstDayOfWeek.date.toLocaleDateString("ja-JP", {
							month: "short",
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
					<Calendar size={18} className="text-emerald-600 dark:text-emerald-400" />
				</div>
				<h3 className="text-lg font-black tracking-tight">アクティビティ・カレンダー</h3>
				<span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-auto">
					Last 6 Months
				</span>
			</div>

			<div className="flex flex-col">
				<div className="flex gap-1 justify-start overflow-x-auto pb-2 scrollbar-hide">
					{/* 曜日ラベル（固定幅） */}
					<div className="flex flex-col gap-1 text-[8px] font-bold text-slate-300 w-7 shrink-0 pt-[22px]">
						<div className="h-2.5"></div>
						<div className="h-2.5">火</div>
						<div className="h-2.5"></div>
						<div className="h-2.5">木</div>
						<div className="h-2.5"></div>
						<div className="h-2.5">土</div>
						<div className="h-2.5"></div>
					</div>

					<div className="flex flex-col gap-2">
						{/* 月ラベル（週の列に合わせる） */}
						<div className="flex h-4 relative">
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
						<div className="flex gap-1">
							{weeks.map((week, weekIndex) => {
								// その週の最初の日付（またはインデックスベースの安定した識別子）をキーにする
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
											return (
												<div
													key={dayKey}
													title={
														day ? `${day.key}: ${day.distance.toFixed(1)}km` : ""
													}
													className={`w-2.5 h-2.5 rounded-[2px] transition-all hover:ring-2 hover:ring-emerald-400 dark:hover:ring-emerald-500 cursor-help ${
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
					<span className="text-[10px] font-bold text-slate-400">Less</span>
					<div className="flex gap-1">
						<div className="w-2.5 h-2.5 rounded-[2px] bg-slate-100 dark:bg-slate-800/50" />
						<div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-200 dark:bg-emerald-900/40" />
						<div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-400 dark:bg-emerald-700/60" />
						<div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500 dark:bg-emerald-500/80" />
						<div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-600 dark:bg-emerald-400" />
					</div>
					<span className="text-[10px] font-bold text-slate-400">More</span>
				</div>
			</div>
		</div>
	);
	};

