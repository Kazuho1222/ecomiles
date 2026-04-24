"use client";

import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import type React from "react";
import { BADGE_DEFINITIONS } from "@/lib/badges";
import { formatDate } from "@/lib/utils";

interface UserBadgeWithData {
	badge: {
		name: string;
		description: string;
	};
	awardedAt: Date;
}

interface BadgeListProps {
	userBadges: UserBadgeWithData[];
}

export const BadgeList: React.FC<BadgeListProps> = ({ userBadges }) => {
	const awardedBadgeNames = userBadges.map((ub) => ub.badge.name);

	return (
		<div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md w-full">
			<div className="flex items-center justify-between mb-6">
				<h2 className="text-xl font-black flex items-center gap-2">
					<Trophy className="text-yellow-500" />
					獲得したバッジ
				</h2>
				<span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
					{userBadges.length} / {BADGE_DEFINITIONS.length}
				</span>
			</div>

			<div className="grid grid-cols-1 gap-3">
				{BADGE_DEFINITIONS.map((badge) => {
					const isAwarded = awardedBadgeNames.includes(badge.name);
					const awardedInfo = userBadges.find(
						(ub) => ub.badge.name === badge.name,
					);

					return (
						<motion.div
							key={badge.id}
							whileHover={isAwarded ? { scale: 1.02, x: 4 } : {}}
							transition={{ type: "spring", stiffness: 400, damping: 25 }}
							className={`relative group flex items-center gap-4 p-4 rounded-2xl ${
								isAwarded
									? "bg-linear-to-br from-amber-50 to-orange-100 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-200 dark:border-amber-900/30"
									: "bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 opacity-40 grayscale"
							}`}
						>
							<div className="text-3xl shrink-0 leading-none">{badge.icon}</div>
							<div className="flex flex-col justify-center min-w-0">
								<p
									className={`text-sm font-black truncate leading-tight ${
										isAwarded
											? "text-amber-900 dark:text-amber-200"
											: "text-slate-500"
									}`}
								>
									{badge.name}
								</p>
								{isAwarded && awardedInfo && (
									<p className="text-[10px] text-amber-700/60 dark:text-amber-400/60 font-bold mt-0.5">
										{formatDate(awardedInfo.awardedAt)}
									</p>
								)}
								{!isAwarded && (
									<p className="text-[10px] text-slate-400 font-medium mt-0.5">
										未獲得
									</p>
								)}
							</div>

							{/* ツールチップ詳細 */}
							<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-slate-700">
								<p className="font-bold mb-1">{badge.name}</p>
								<p className="opacity-80 mb-2">{badge.description}</p>
								{!isAwarded && (
									<p className="text-[10px] text-emerald-400 font-bold border-t border-slate-700 pt-2">
										条件: {badge.threshold}{" "}
										{badge.type === "DISTANCE"
											? "km"
											: badge.type === "POINTS"
												? "pts"
												: "削減量"}
									</p>
								)}
							</div>
						</motion.div>
					);
				})}
			</div>

			{userBadges.length === 0 && (
				<div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl text-center">
					<p className="text-sm text-slate-500 font-medium">
						アクティビティを記録して最初のバッジを獲得しましょう！
					</p>
				</div>
			)}
		</div>
	);
};
