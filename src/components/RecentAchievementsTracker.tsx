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
		const badgeKey = `seenBadgeNames_${userId}`;
		
		const storedActivityIds = localStorage.getItem(activityKey);
		const storedBadgeNames = localStorage.getItem(badgeKey);

		const seenActivityIds = new Set<string>(storedActivityIds ? JSON.parse(storedActivityIds) : []);
		const seenBadgeNames = new Set<string>(storedBadgeNames ? JSON.parse(storedBadgeNames) : []);
		
		const isReturningUser = storedActivityIds !== null || storedBadgeNames !== null;
		const now = new Date();
		const RECENT_THRESHOLD = 10 * 60 * 1000; // 10分

		// 1. デバイス初期化時の処理
		if (!isInitialized.current) {
			// バッジ既読リストがまだ存在しない場合、既存のバッジを「既読」として初期化する
			if (storedBadgeNames === null && badges.length > 0) {
				const initialBadgeNames = badges.map(b => b.badge.name);
				localStorage.setItem(badgeKey, JSON.stringify(initialBadgeNames));
			}

			// 完全に初回訪問時（アクティビティ履歴もなし）の処理
			if (!isReturningUser) {
				const hasVeryRecent = activities.some(a => (now.getTime() - new Date(a.createdAt).getTime()) < RECENT_THRESHOLD);
				const hasVeryRecentBadge = badges.some(b => (now.getTime() - new Date(b.awardedAt).getTime()) < RECENT_THRESHOLD);

				if (!hasVeryRecent && !hasVeryRecentBadge) {
					// 最近のものが全くなければ、全件既読にして終了
					const initialActivityIds = activities.map(a => a.id);
					localStorage.setItem(activityKey, JSON.stringify(initialActivityIds));
					isInitialized.current = true;
					return;
				}
				// 最近のものがある場合は、このまま下のチェック処理に進んでトーストを出す
			}
		}

		// 2. アクティビティのチェック
		let newActivities = activities.filter(a => !seenActivityIds.has(a.id));

		// 初回訪問時かつ非リピーター（新デバイス）の場合は、全件出すと多すぎるので最近のものに絞る
		if (!isInitialized.current && !isReturningUser) {
			newActivities = newActivities.filter(a => (now.getTime() - new Date(a.createdAt).getTime()) < RECENT_THRESHOLD);
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

			// ページロード直後の場合は少し遅らせて表示
			setTimeout(() => {
				toast.success(
					`${newActivities.length} 件の新しいアクティビティが同期されました`,
					{
						icon: <CheckCircle2 className="text-emerald-500" />,
						description: `離れている間に ${newActivities.length} 件のデータを更新しました。CO2を ${co2.toFixed(2)}kg 削減し、地球の寿命を ${lifespanText} 延ばしました！`,
						duration: 5000,
					},
				);
			}, isInitialized.current ? 0 : 1500);

			const updatedIds = Array.from(new Set([...activities.map(a => a.id), ...Array.from(seenActivityIds)])).slice(0, 50);
			localStorage.setItem(activityKey, JSON.stringify(updatedIds));
		}

		// 3. バッジのチェック
		let newBadges = badges.filter(b => !seenBadgeNames.has(b.badge.name));

		// 新デバイスの場合は最近のものに絞る
		if (!isInitialized.current && !isReturningUser) {
			newBadges = newBadges.filter(b => (now.getTime() - new Date(b.awardedAt).getTime()) < RECENT_THRESHOLD);
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
				}, (index + 1) * 1000 + (isInitialized.current ? 0 : 1500));
			});

			const updatedNames = Array.from(new Set([...badges.map(b => b.badge.name), ...Array.from(seenBadgeNames)])).slice(0, 50);
			localStorage.setItem(badgeKey, JSON.stringify(updatedNames));
		}

		isInitialized.current = true;
	}, [userId, activities, badges]);

	return null;
};
