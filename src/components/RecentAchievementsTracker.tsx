"use client";

import React, { useEffect, useRef } from "react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { CheckCircle2, Award, Leaf } from "lucide-react";
import { calculateCO2Reduction, calculateEarthLifespanExtension } from "@/lib/eco-utils";

interface RecentAchievementsTrackerProps {
	userId: string;
	activities: { id: string; distance: number; createdAt: Date | string; activityType: string }[];
	badges: { id: string; awardedAt: Date | string; badge: { name: string; description: string } }[];
}

export const RecentAchievementsTracker: React.FC<RecentAchievementsTrackerProps> = ({
	userId,
	activities,
	badges,
}) => {
	const isFirstMount = useRef(true);

	useEffect(() => {
		// 初回マウント時またはデータ更新時にチェック
		const lastSeenActivityId = localStorage.getItem(`lastSeenActivityId_${userId}`);
		const lastSeenBadgeId = localStorage.getItem(`lastSeenBadgeId_${userId}`);

		// 初回マウント時は「過去に通知済み」としてマークする（大量の古い通知を防ぐ）
		if (isFirstMount.current && !lastSeenActivityId) {
			if (activities.length > 0) {
				localStorage.setItem(`lastSeenActivityId_${userId}`, activities[0].id);
			}
			if (badges.length > 0) {
				localStorage.setItem(`lastSeenBadgeId_${userId}`, badges[0].id);
			}
			isFirstMount.current = false;
			return;
		}

		// 1. 新しいアクティビティをチェック (WebHook等で裏で追加されたもの)
		const newActivities = [];
		if (lastSeenActivityId && activities.length > 0) {
			for (const activity of activities) {
				if (activity.id === lastSeenActivityId) break;
				newActivities.push(activity);
			}
		}

		if (newActivities.length > 0) {
			const totalDistance = newActivities.reduce((sum, a) => sum + a.distance, 0);
			const co2 = calculateCO2Reduction(totalDistance);
			const lifespan = calculateEarthLifespanExtension(co2);
			let lifespanText = "";
			if (lifespan < 0.001) {
				lifespanText = `${(lifespan * 1000000).toFixed(1)}μ秒`;
			} else if (lifespan < 1) {
				lifespanText = `${(lifespan * 1000).toFixed(1)}ミリ秒`;
			} else {
				lifespanText = `${lifespan.toFixed(2)}秒`;
			}

			toast.success(`${newActivities.length} 件の新しいアクティビティが同期されました`, {
				icon: <CheckCircle2 className="text-emerald-500" />,
				description: `裏側でデータを更新しました。CO2を ${co2.toFixed(2)}kg 削減し、地球の寿命を ${lifespanText} 延ばしました！`,
				duration: 5000,
			});

			localStorage.setItem(`lastSeenActivityId_${userId}`, activities[0].id);
		}

		// 2. 新しいバッジをチェック
		const newBadges = [];
		if (lastSeenBadgeId && badges.length > 0) {
			for (const ub of badges) {
				if (ub.id === lastSeenBadgeId) break;
				newBadges.push(ub);
			}
		}

		if (newBadges.length > 0) {
			confetti({
				particleCount: 150,
				spread: 70,
				origin: { y: 0.6 },
				colors: ["#10b981", "#059669", "#34d399", "#fbbf24"],
			});

			newBadges.forEach((ub, index) => {
				setTimeout(() => {
					toast.success(`新バッジ獲得！: ${ub.badge.name}`, {
						icon: <Award className="text-amber-500" />,
						description: ub.badge.description,
						duration: 6000,
					});
				}, (index + 1) * 1000);
			});

			localStorage.setItem(`lastSeenBadgeId_${userId}`, badges[0].id);
		}

		isFirstMount.current = false;
	}, [userId, activities, badges]);

	return null; // 視覚的要素は持たない
};
