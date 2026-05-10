"use client";

import { useUser } from "@clerk/nextjs";
import confetti from "canvas-confetti";
import { Award, CheckCircle2, Leaf, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { calculateEarthLifespanExtension } from "@/lib/eco-utils";

interface SyncBadge {
	name: string;
	description: string;
}

interface SyncResult {
	success: boolean;
	newActivitiesCount: number;
	pointsAwardedTotal: number;
	co2ReductionDelta: number;
	newBadges: SyncBadge[];
	newActivityIds?: string[];
}

export function SyncButton() {
	const { user } = useUser();
	const [isSyncing, setIsSyncing] = useState(false);
	const router = useRouter();

	const handleSync = async () => {
		setIsSyncing(true);
		const syncToastId = toast.loading("Stravaからデータを同期中...", {
			description: "しばらくお待ちください。",
		});

		try {
			const response = await fetch("/api/strava/sync", {
				method: "POST",
			});

			if (response.ok) {
				const result: SyncResult = await response.json();
				toast.dismiss(syncToastId);

				if (result.newActivitiesCount > 0) {
					// 1. 同期されたIDを既読リストに追加して重複トーストを防ぐ
					if (user?.id && result.newActivityIds) {
						const activityKey = `seenActivityIds_${user.id}`;
						const storedIds = localStorage.getItem(activityKey);
						const seenIds = new Set<string>(storedIds ? JSON.parse(storedIds) : []);
						
						result.newActivityIds.forEach(id => seenIds.add(id));
						localStorage.setItem(activityKey, JSON.stringify(Array.from(seenIds).slice(0, 50)));
					}

					// 2. 基本的な同期成功トースト
					toast.success(
						`${result.newActivitiesCount} 件のアクティビティを同期しました！`,
						{
							icon: <CheckCircle2 className="text-emerald-500" />,
							description: `累計で +${result.pointsAwardedTotal} pts を獲得しました。`,
						},
					);

					// 2. CO2削減の詳細トースト
					if (result.co2ReductionDelta > 0) {
						const lifespan = calculateEarthLifespanExtension(
							result.co2ReductionDelta,
						);
						let lifespanText = "";
						if (lifespan < 0.001) {
							lifespanText = `${(lifespan * 1000000).toFixed(1)}μ秒`;
						} else if (lifespan < 1) {
							lifespanText = `${(lifespan * 1000).toFixed(1)}ミリ秒`;
						} else {
							lifespanText = `${lifespan.toFixed(2)}秒`;
						}

						toast("環境への貢献を更新しました", {
							icon: <Leaf className="text-emerald-500" />,
							description: `CO2を ${result.co2ReductionDelta.toFixed(2)}kg 削減！地球の寿命を ${lifespanText} 延ばしました。`,
							duration: 5000,
						});
					}

					// 3. バッジ獲得時の演出
					if (result.newBadges && result.newBadges.length > 0) {
						confetti({
							particleCount: 150,
							spread: 70,
							origin: { y: 0.6 },
							colors: ["#10b981", "#059669", "#34d399", "#fbbf24"],
						});

						result.newBadges.forEach((badge, index) => {
							setTimeout(
								() => {
									toast.success(`新バッジ獲得！: ${badge.name}`, {
										icon: <Award className="text-amber-500" />,
										description: badge.description,
										duration: 6000,
									});
								},
								(index + 1) * 1000,
							);
						});
					}
				} else {
					toast.info("新しいアクティビティはありませんでした。", {
						description:
							"Stravaに最新の移動が記録されているか確認してください。",
					});
				}

				router.refresh();
			} else {
				toast.dismiss(syncToastId);
				toast.error("同期に失敗しました", {
					description:
						"Stravaとの接続状態を確認するか、しばらく時間をおいて試してください。",
				});
			}
		} catch (error) {
			console.error("Sync error:", error);
			toast.dismiss(syncToastId);
			toast.error("予期せぬエラーが発生しました");
		} finally {
			setIsSyncing(false);
		}
	};

	return (
		<Button
			variant="outline"
			size="sm"
			onClick={handleSync}
			disabled={isSyncing}
			className="flex items-center gap-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors"
		>
			<RefreshCw
				className={`h-4 w-4 ${isSyncing ? "animate-spin text-emerald-500" : ""}`}
			/>
			{isSyncing ? "同期中..." : "データを更新"}
		</Button>
	);
}
