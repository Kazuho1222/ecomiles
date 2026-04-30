"use client";

import { CheckCircle2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

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
					// 成果のサマリー通知（詳細はRecentAchievementsTrackerが担当）
					toast.success(
						`${result.newActivitiesCount} 件のアクティビティを同期しました！`,
						{
							icon: <CheckCircle2 className="text-emerald-500" />,
							description: `累計で +${result.pointsAwardedTotal} pts を獲得しました。`,
						},
					);
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
