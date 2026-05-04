"use client";

import confetti from "canvas-confetti";
import { Award, CheckCircle2 } from "lucide-react";
import type React from "react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import {
	calculateCO2Reduction,
	calculateEarthLifespanExtension,
} from "@/lib/eco-utils";

interface BadgeInfo {
	id: string;
	awardedAt: Date | string;
	badge: { name: string; description: string };
}

interface ActivityInfo {
	id: string;
	distance: number;
	createdAt: Date | string;
	activityType: string;
}

interface RecentAchievementsTrackerProps {
	userId: string;
	activities: ActivityInfo[];
	badges: BadgeInfo[];
}

export const RecentAchievementsTracker: React.FC<
	RecentAchievementsTrackerProps
> = ({ userId, activities, badges }) => {
	const isFirstMount = useRef(true);

	useEffect(() => {
		// 初回マウント時またはデータ更新時にチェック
		const lastSeenActivityId = localStorage.getItem(
			`lastSeenActivityId_${userId}`,
		);
		const lastSeenBadgeId = localStorage.getItem(`lastSeenBadgeId_${userId}`);

		console.log("[Tracker] Checking for updates...", {
			userId,
			activitiesCount: activities.length,
			badgesCount: badges.length,
			lastSeenActivityId,
			isFirstMount: isFirstMount.current,
		});

		// 1. 新しいアクティビティをチェック
		const newActivities: ActivityInfo[] = [];

		if (activities.length > 0) {
			if (!lastSeenActivityId) {
				// 履歴がまだない場合
				if (!isFirstMount.current) {
					// 初回マウントでなければ、新しく追加されたものとみなす
					newActivities.push(activities[0]);
					console.log("[Tracker] First activity detected after mount!");
				} else {
					// 初回マウントなら、現在の最新を記録して終了（通知は出さない）
					localStorage.setItem(`lastSeenActivityId_${userId}`, activities[0].id);
					console.log("[Tracker] Initialized lastSeenActivityId");
				}
			} else {
				// 履歴がある場合、差分をチェック
				const lastSeenExists = activities.some(
					(a) => a.id === lastSeenActivityId,
				);
				if (!lastSeenExists) {
					// 保存されていたIDが見つからない（大量同期でリストから漏れた等）場合
					// 現在のリストにあるものすべてを「新着」として扱う
					newActivities.push(...activities);
					console.log(
						"[Tracker] lastSeenActivityId not found in list. Treating all as new.",
					);
				} else {
					for (const activity of activities) {
						if (activity.id === lastSeenActivityId) break;
						newActivities.push(activity);
					}
				}
			}
		}

		if (newActivities.length > 0) {
			console.log(`[Tracker] Found ${newActivities.length} new activities!`);
			const totalDistance = newActivities.reduce(
				(sum, a) => sum + a.distance,
				0,
			);
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

			toast.success(
				`${newActivities.length} 件の新しいアクティビティが同期されました`,
				{
					icon: <CheckCircle2 className="text-emerald-500" />,
					description: `裏側でデータを更新しました。CO2を ${co2.toFixed(2)}kg 削減し、地球の寿命を ${lifespanText} 延ばしました！`,
					duration: 5000,
				},
			);

			localStorage.setItem(`lastSeenActivityId_${userId}`, activities[0].id);
		}

		// 2. 新しいバッジをチェック
		const newBadges: BadgeInfo[] = [];
		if (badges.length > 0) {
			if (!lastSeenBadgeId) {
				if (!isFirstMount.current) {
					newBadges.push(badges[0]);
				} else {
					localStorage.setItem(`lastSeenBadgeId_${userId}`, badges[0].id);
				}
			} else {
				const lastSeenExists = badges.some((ub) => ub.id === lastSeenBadgeId);
				if (!lastSeenExists) {
					// バッジIDが見つからない場合、最新のものを通知対象にする
					newBadges.push(...badges);
					console.log(
						"[Tracker] lastSeenBadgeId not found in list. Treating all as new.",
					);
				} else {
					for (const ub of badges) {
						if (ub.id === lastSeenBadgeId) break;
						newBadges.push(ub);
					}
				}
			}
		}

		if (newBadges.length > 0) {
			console.log(`[Tracker] Found ${newBadges.length} new badges!`);
			confetti({
				particleCount: 150,
				spread: 70,
				origin: { y: 0.6 },
				colors: ["#10b981", "#059669", "#34d399", "#fbbf24"],
			});

			newBadges.forEach((ub, index) => {
				setTimeout(
					() => {
						toast.success(`新バッジ獲得！: ${ub.badge.name}`, {
							icon: <Award className="text-amber-500" />,
							description: ub.badge.description,
							duration: 6000,
						});
					},
					(index + 1) * 1000,
				);
			});

			localStorage.setItem(`lastSeenBadgeId_${userId}`, badges[0].id);
		}

		isFirstMount.current = false;
	}, [userId, activities, badges]);

	return null; // 視覚的要素は持たない
};
