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
	const isInitialized = useRef(false);
	
	useEffect(() => {
		if (!userId) return;

		const activityKey = `seenActivityIds_${userId}`;
		const badgeKey = `seenBadgeIds_${userId}`;
		
		const storedActivityIds = localStorage.getItem(activityKey);
		const storedBadgeIds = localStorage.getItem(badgeKey);

		const seenActivityIds = new Set<string>(storedActivityIds ? JSON.parse(storedActivityIds) : []);
		const seenBadgeIds = new Set<string>(storedBadgeIds ? JSON.parse(storedBadgeIds) : []);
		
		// localStorageにデータが存在したか（リピーターか）
		const isReturningUser = storedActivityIds !== null;

		console.log("[Tracker] Checking for updates...", {
			userId,
			activitiesCount: activities.length,
			badgesCount: badges.length,
			seenActivities: seenActivityIds.size,
			seenBadges: seenBadgeIds.size,
			isInitialized: isInitialized.current,
			isReturningUser
		});

		// 完全に初回訪問時（localStorageがまったくない）の処理
		if (!isReturningUser && activities.length > 0 && !isInitialized.current) {
			const initialIds = activities.map(a => a.id);
			localStorage.setItem(activityKey, JSON.stringify(initialIds));
			console.log("[Tracker] Initialized activity storage for new user");
			isInitialized.current = true;
			return;
		}

		// 1. アクティビティのチェック
		const newActivities = activities.filter(a => !seenActivityIds.has(a.id));

		// リピーターであれば、初回実行時(isInitialized=false)でも通知を許可する
		if (newActivities.length > 0 && (isInitialized.current || isReturningUser)) {
			console.log(`[Tracker] Found ${newActivities.length} new activities`);
			
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
					description: `離れている間に ${newActivities.length} 件のデータを更新しました。CO2を ${co2.toFixed(2)}kg 削減し、地球の寿命を ${lifespanText} 延ばしました！`,
					duration: 5000,
				},
			);

			// 見たIDリストを更新 (直近50件程度を保持)
			const updatedIds = Array.from(new Set([...activities.map(a => a.id), ...Array.from(seenActivityIds)])).slice(0, 50);
			localStorage.setItem(activityKey, JSON.stringify(updatedIds));
		}

		// 2. バッジのチェック
		const newBadges = badges.filter(b => !seenBadgeIds.has(b.id));

		if (newBadges.length > 0 && isInitialized.current) {
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

			const updatedIds = Array.from(new Set([...badges.map(b => b.id), ...Array.from(seenBadgeIds)])).slice(0, 50);
			localStorage.setItem(badgeKey, JSON.stringify(updatedIds));
		} else if (newBadges.length > 0) {
			const updatedIds = Array.from(new Set([...badges.map(b => b.id), ...Array.from(seenBadgeIds)])).slice(0, 50);
			localStorage.setItem(badgeKey, JSON.stringify(updatedIds));
		}

		isInitialized.current = true;
	}, [userId, activities, badges]);

	return null;
};

