"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export interface SyncBadge {
	name: string;
	description: string;
}

export interface SyncResult {
	success: boolean;
	newActivitiesCount: number;
	pointsAwardedTotal: number;
	co2ReductionDelta: number;
	newBadges: SyncBadge[];
	newActivityIds?: string[];
	errorType?: string;
}

export interface UseSmartAutoSyncOptions {
	/**
	 * ユーザーID (Clerk userId)
	 */
	userId?: string | null;
	/**
	 * 外部サービスと連携中かどうか
	 */
	intervalsConnected?: boolean;
	/**
	 * デモモードかどうか（デモ時は外部API呼び出しを行わない）
	 */
	isDemoMode?: boolean;
	/**
	 * 同期プロバイダー (デフォルト: "intervals")
	 */
	provider?: "intervals";
	/**
	 * 外部APIとの自動同期のクールダウン時間 (ミリ秒)
	 * 前回の同期からこの時間が経過していない場合は自動同期をスキップ
	 * デフォルト: 5分 (300,000ms)
	 */
	cooldownMs?: number;
	/**
	 * タブ・画面を離れていたとみなす最小時間 (ミリ秒)
	 * 一瞬のタブ切り替えでの誤発火を防ぐ。デフォルト: 15秒 (15,000ms)
	 */
	minAwayDurationMs?: number;
	/**
	 * 初回マウント時の自動同期を遅延させる時間 (ミリ秒)
	 * 初回レンダリング・操作の快適性を損なわないため。デフォルト: 1,500ms
	 */
	mountDelayMs?: number;
	/**
	 * 同期開始時のコールバック
	 */
	onSyncStart?: () => void;
	/**
	 * 同期完了時のコールバック
	 */
	onSyncComplete?: (result: SyncResult | null) => void;
}

export interface UseSmartAutoSyncReturn {
	/**
	 * 現在バックグラウンド同期中かどうか
	 */
	isSyncing: boolean;
	/**
	 * 最終同期完了タイムスタンプ (ミリ秒)
	 */
	lastSyncTime: number | null;
	/**
	 * 手動または任意のタイミングで同期をトリガーする関数
	 * @param force クールダウンを無視して強制実行するかどうか
	 */
	triggerSync: (force?: boolean) => Promise<SyncResult | null>;
}

const DEFAULT_COOLDOWN_MS = 5 * 60 * 1000; // 5分
const DEFAULT_MIN_AWAY_MS = 15 * 1000; // 15秒
const DEFAULT_MOUNT_DELAY_MS = 1500; // 1.5秒

/**
 * ログイン時やアプリ復帰時に、外部サービス（Intervals.icu）とのデータ同期および
 * 画面キャッシュの再検証をスマートに自動実行するカスタムフック
 */
export function useSmartAutoSync({
	userId,
	intervalsConnected = false,
	isDemoMode = false,
	provider = "intervals",
	cooldownMs = DEFAULT_COOLDOWN_MS,
	minAwayDurationMs = DEFAULT_MIN_AWAY_MS,
	mountDelayMs = DEFAULT_MOUNT_DELAY_MS,
	onSyncStart,
	onSyncComplete,
}: UseSmartAutoSyncOptions): UseSmartAutoSyncReturn {
	const router = useRouter();
	const [isSyncing, setIsSyncing] = useState(false);
	const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

	// 多重実行防止用ref
	const isSyncingRef = useRef(false);
	// 最後に非表示（バックグラウンド化）された時刻
	const hiddenAtRef = useRef<number | null>(null);
	// クールダウンや最新設定の参照保持
	const optionsRef = useRef({
		userId,
		intervalsConnected,
		isDemoMode,
		provider,
		cooldownMs,
		minAwayDurationMs,
		onSyncStart,
		onSyncComplete,
	});

	useEffect(() => {
		optionsRef.current = {
			userId,
			intervalsConnected,
			isDemoMode,
			provider,
			cooldownMs,
			minAwayDurationMs,
			onSyncStart,
			onSyncComplete,
		};
	}, [
		userId,
		intervalsConnected,
		isDemoMode,
		provider,
		cooldownMs,
		minAwayDurationMs,
		onSyncStart,
		onSyncComplete,
	]);

	/**
	 * 前回の同期時刻（自動同期または手動同期の最新）を取得
	 */
	const getLastRecordedSyncTime = useCallback((targetUserId: string): number | null => {
		if (typeof window === "undefined") return null;
		try {
			const autoTime = Number(
				localStorage.getItem(`lastAutoSyncTime_${targetUserId}`) || "0",
			);
			const manualTime = Number(
				localStorage.getItem(`lastManualSyncTime_${targetUserId}`) || "0",
			);
			const latest = Math.max(autoTime, manualTime);
			return latest > 0 ? latest : null;
		} catch {
			return null;
		}
	}, []);

	// 初期表示時に localStorage から最終同期時刻を読み出す
	useEffect(() => {
		if (!userId) return;
		const recorded = getLastRecordedSyncTime(userId);
		if (recorded) {
			setLastSyncTime(recorded);
		}
	}, [userId, getLastRecordedSyncTime]);

	/**
	 * 同期処理を実行するメインロジック
	 */
	const triggerSync = useCallback(
		async (force: boolean = false): Promise<SyncResult | null> => {
			const current = optionsRef.current;
			if (!current.userId || !current.intervalsConnected || current.isDemoMode) {
				return null;
			}

			if (isSyncingRef.current) {
				return null;
			}

			// クールダウンチェック（force指定がない場合）
			if (!force) {
				const lastTime = getLastRecordedSyncTime(current.userId);
				if (lastTime && Date.now() - lastTime < current.cooldownMs) {
					return null;
				}
			}

			isSyncingRef.current = true;
			setIsSyncing(true);
			current.onSyncStart?.();

			try {
				const response = await fetch(`/api/${current.provider}/sync`, {
					method: "POST",
				});

				if (response.ok) {
					const result: SyncResult = await response.json();
					const now = Date.now();

					try {
						localStorage.setItem(
							`lastAutoSyncTime_${current.userId}`,
							now.toString(),
						);
					} catch (e) {
						console.warn("[useSmartAutoSync] Failed to write localStorage:", e);
					}

					setLastSyncTime(now);

					// Server Componentの再検証を行い、画面データを最新化
					router.refresh();

					current.onSyncComplete?.(result);
					return result;
				}

				// 認証エラー（トークン失効）
				if (response.status === 401) {
					const sessionKey = `warnedAuthExpired_${current.userId}`;
					if (!sessionStorage.getItem(sessionKey)) {
						sessionStorage.setItem(sessionKey, "true");
						toast.error("Intervals.icuの連携期限が切れました", {
							description:
								"最新データを自動更新するには、再度連携を行ってください。",
						});
					}
				} else {
					console.warn(
						`[useSmartAutoSync] Sync returned status ${response.status}`,
					);
				}

				current.onSyncComplete?.(null);
				return null;
			} catch (error) {
				console.warn("[useSmartAutoSync] Background sync unexpected error:", error);
				current.onSyncComplete?.(null);
				return null;
			} finally {
				isSyncingRef.current = false;
				setIsSyncing(false);
			}
		},
		[getLastRecordedSyncTime, router],
	);

	/**
	 * 1. ログイン直後・コンポーネント初回マウント時の自動同期判定
	 */
	useEffect(() => {
		if (!userId || !intervalsConnected || isDemoMode) return;

		const timer = setTimeout(() => {
			const lastTime = getLastRecordedSyncTime(userId);
			const now = Date.now();

			// 前回の同期からクールダウン以上経過している場合（または初回アクセス時）
			if (!lastTime || now - lastTime >= cooldownMs) {
				triggerSync(false);
			}
		}, mountDelayMs);

		return () => clearTimeout(timer);
	}, [
		userId,
		intervalsConnected,
		isDemoMode,
		cooldownMs,
		mountDelayMs,
		getLastRecordedSyncTime,
		triggerSync,
	]);

	/**
	 * 2. 画面復帰時（タブ切り替え・スマホ再開・フォーカス復帰）の自動同期判定
	 */
	useEffect(() => {
		if (!userId || !intervalsConnected || isDemoMode) return;

		const handleVisibilityChange = () => {
			if (document.visibilityState === "hidden") {
				hiddenAtRef.current = Date.now();
			} else if (document.visibilityState === "visible") {
				const now = Date.now();
				const hiddenAt = hiddenAtRef.current;
				hiddenAtRef.current = null;

				// 一定時間以上離れていたかチェック（離脱時間が記録されていない場合も許容）
				const awayDuration = hiddenAt ? now - hiddenAt : null;
				const isAwayLongEnough =
					awayDuration === null || awayDuration >= minAwayDurationMs;

				if (isAwayLongEnough) {
					const lastTime = getLastRecordedSyncTime(userId);
					const hasCooldownPassed =
						!lastTime || now - lastTime >= cooldownMs;

					if (hasCooldownPassed) {
						// クールダウン経過済み → 外部APIから最新データをバックグラウンド同期
						triggerSync(false);
					} else {
						// クールダウン中だが一定時間離れていた場合 → 外部APIは叩かず画面キャッシュ/DBのみ再検証
						router.refresh();
					}
				}
			}
		};

		// iOS Safari等のbfcache復帰やフォーカス対応
		const handlePageShow = (e: PageTransitionEvent) => {
			if (e.persisted) {
				// キャッシュから復帰した場合
				router.refresh();
				const lastTime = getLastRecordedSyncTime(userId);
				if (!lastTime || Date.now() - lastTime >= cooldownMs) {
					triggerSync(false);
				}
			}
		};

		const handleFocus = () => {
			if (document.visibilityState === "visible") {
				const lastTime = getLastRecordedSyncTime(userId);
				if (!lastTime || Date.now() - lastTime >= cooldownMs) {
					triggerSync(false);
				}
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);
		window.addEventListener("pageshow", handlePageShow);
		window.addEventListener("focus", handleFocus);

		return () => {
			document.removeEventListener("visibilitychange", handleVisibilityChange);
			window.removeEventListener("pageshow", handlePageShow);
			window.removeEventListener("focus", handleFocus);
		};
	}, [
		userId,
		intervalsConnected,
		isDemoMode,
		cooldownMs,
		minAwayDurationMs,
		router,
		getLastRecordedSyncTime,
		triggerSync,
	]);

	return {
		isSyncing,
		lastSyncTime,
		triggerSync,
	};
}
