"use client";

import confetti from "canvas-confetti";
import { Award, CheckCircle2, Leaf, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { calculateEarthLifespanExtension } from "@/lib/eco-utils";

export function SyncButton() {
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
				const result = await response.json();
				toast.dismiss(syncToastId);

				if (result.newActivitiesCount > 0) {
					// 成果の通知
					toast.success(
						`${result.newActivitiesCount} 件のアクティビティを同期しました！`,
						{
							icon: <CheckCircle2 className="text-emerald-500" />,
							description: `累計で +${result.pointsAwardedTotal} pts を獲得しました。`,
						},
					);

					// CO2削減の通知
					if (result.co2ReductionDelta > 0) {
						const lifespan = calculateEarthLifespanExtension(
							result.co2ReductionDelta,
						);
						const lifespanText =
							lifespan < 0.001
								? `${(lifespan * 1000000).toFixed(1)}μ秒`
								: `${lifespan.toFixed(2)}秒`;

						toast("環境への貢献を更新しました", {
							icon: <Leaf className="text-emerald-500" />,
							description: `CO2を ${result.co2ReductionDelta.toFixed(2)}kg 削減！地球の寿命を ${lifespanText} 延ばしました。`,
							duration: 5000,
						});
					}

					// バッジ獲得の通知
					if (result.newBadges && result.newBadges.length > 0) {
						confetti({
							particleCount: 150,
							spread: 70,
							origin: { y: 0.6 },
							colors: ["#10b981", "#059669", "#34d399", "#fbbf24"],
						});

						result.newBadges.forEach((badge: any, index: number) => {
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
