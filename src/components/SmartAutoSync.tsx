"use client";

import { CheckCircle2, RefreshCw } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { useSmartAutoSync, type UseSmartAutoSyncOptions } from "@/hooks/useSmartAutoSync";

export interface SmartAutoSyncProps extends UseSmartAutoSyncOptions {
	/**
	 * 同期中インジケーター（右下のフローティングバッジ）を表示するかどうか
	 * デフォルト: true
	 */
	showIndicator?: boolean;
}

/**
 * ログイン時および復帰時の自動スマート同期を実行・監視するコンポーネント
 */
export const SmartAutoSync: React.FC<SmartAutoSyncProps> = ({
	showIndicator = true,
	...options
}) => {
	const [showSuccessBadge, setShowSuccessBadge] = useState(false);

	const { isSyncing } = useSmartAutoSync({
		...options,
		onSyncComplete: (result) => {
			options.onSyncComplete?.(result);

			// 新しいアクティビティが同期できた場合、控えめなバッジを1.5秒だけ表示
			if (result && result.newActivitiesCount > 0 && showIndicator) {
				setShowSuccessBadge(true);
				setTimeout(() => {
					setShowSuccessBadge(false);
				}, 2000);
			}
		},
	});

	if (!showIndicator) {
		return null;
	}

	return (
		<div
			aria-live="polite"
			className="fixed bottom-4 right-4 z-40 pointer-events-none transition-all duration-300"
		>
			{isSyncing && (
				<div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 dark:bg-slate-800/90 text-white rounded-full text-xs shadow-lg backdrop-blur border border-slate-700/60 animate-in fade-in slide-in-from-bottom-2">
					<RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-400" />
					<span className="font-medium">最新データを同期中...</span>
				</div>
			)}

			{!isSyncing && showSuccessBadge && (
				<div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600/95 text-white rounded-full text-xs shadow-lg backdrop-blur border border-emerald-500/60 animate-in fade-in slide-in-from-bottom-2">
					<CheckCircle2 className="h-3.5 w-3.5 text-white" />
					<span className="font-medium">最新データに更新しました</span>
				</div>
			)}
		</div>
	);
};
