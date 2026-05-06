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

/**
 * 裏側で同期されたアクティビティやバッジ獲得を検知してトースト通知を出すコンポーネント
 */
export const RecentAchievementsTracker: React.FC<
	RecentAchievementsTrackerProps
> = ({ userId, activities, badges }) => {
	// コンポーネントの生存期間中だけでなく、セッション全体で「初期化済み」かを管理
	// router.refresh() による再マウント対策
	const isInitialized = useRef(false);
	
	// 前回のデータ長を記録して、純粋な増加を検知しやすくする
	const prevActivitiesCount = useRef<number | null>(null);
	const prevBadgesCount = useRef<number | null>(null);

	useEffect(() => {
		if (!userId) return;

		const activityKey = `lastSeenActivityId_${userId}`;
		const badgeKey = `lastSeenBadgeId_${userId}`;
		
		const lastSeenActivityId = localStorage.getItem(activityKey);
		const lastSeenBadgeId = localStorage.getItem(badgeKey);

		console.log("[Tracker] Checking for updates...", {
			userId,
			activitiesCount: activities.length,
			badgesCount: badges.length,
			lastSeenActivityId,
			lastSeenBadgeId,
			isInitialized: isInitialized.current,
		});

		// 1. アクティビティのチェック
		if (activities.length > 0) {
			const newActivities: ActivityInfo[] = [];

			if (!lastSeenActivityId) {
				// 履歴がない場合
				if (isInitialized.current || prevActivitiesCount.current === 0) {
					// すでに初期化済みで、0から増えた、またはマウント後に増えた場合は「新着」とみなす
					newActivities.push(...activities);
					console.log("[Tracker] New activities detected (0 -> N)");
				} else {
					// 初回訪問時は静かに初期化
					localStorage.setItem(activityKey, activities[0].id);
					console.log("[Tracker] Initialized activity storage silently");
				}
			} else {
				// 履歴がある場合、差分をチェック
				const lastSeenIndex = activities.findIndex(a => a.id === lastSeenActivityId);
				
				if (lastSeenIndex === -1) {
					// 保存されていたIDが見つからない場合（古いか、リスト外）
					// リストにあるものすべてを新着とする（初回のみ）
					if (isInitialized.current) {
						newActivities.push(...activities);
						console.log("[Tracker] lastSeen ID not found, treating all as new");
					}
				} else if (lastSeenIndex > 0) {
					// インデックス0より後ろに前回の最新がある = 0..lastSeenIndex-1 が新着
					newActivities.push(...activities.slice(0, lastSeenIndex));
					console.log(`[Tracker] Found ${lastSeenIndex} new activities`);
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

				toast.success(
					`${newActivities.length} 件の新しいアクティビティが同期されました`,
					{
						icon: <CheckCircle2 className="text-emerald-500" />,
						description: `裏側でデータを更新しました。CO2を ${co2.toFixed(2)}kg 削減し、地球の寿命を ${lifespanText} 延ばしました！`,
						duration: 5000,
					},
				);

				localStorage.setItem(activityKey, activities[0].id);
			}
		}

		// 2. バッジのチェック
		if (badges.length > 0) {
			const newBadges: BadgeInfo[] = [];

			if (!lastSeenBadgeId) {
				if (isInitialized.current || prevBadgesCount.current === 0) {
					newBadges.push(...badges);
				} else {
					localStorage.setItem(badgeKey, badges[0].id);
				}
			} else {
				const lastSeenIndex = badges.findIndex(b => b.id === lastSeenBadgeId);
				if (lastSeenIndex === -1) {
					if (isInitialized.current) {
						newBadges.push(...badges);
					}
				} else if (lastSeenIndex > 0) {
					newBadges.push(...badges.slice(0, lastSeenIndex));
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
					setTimeout(() => {
						toast.success(`新バッジ獲得！: ${ub.badge.name}`, {
							icon: <Award className="text-amber-500" />,
							description: ub.badge.description,
							duration: 6000,
						});
					}, (index + 1) * 1000);
				});

				localStorage.setItem(badgeKey, badges[0].id);
			}
		}

		isInitialized.current = true;
		prevActivitiesCount.current = activities.length;
		prevBadgesCount.current = badges.length;
	}, [userId, activities, badges]);

	return null;
};

