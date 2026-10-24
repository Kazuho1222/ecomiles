import { ActivityType } from "@prisma/client";
import { checkAndAwardBadges } from "./badge-service";
import { BadgeDefinition } from "./badges";
import { calculateCO2Reduction } from "./eco-utils";
import prisma from "./prisma";

import {
	getIntervalsTokensFromClerk,
	saveIntervalsTokensToClerk,
} from "./intervals-token-storage";

interface IntervalsTokenResponse {
	access_token: string;
	refresh_token?: string;
	expires_in?: number;
	athlete: {
		id: string | number;
		name: string;
	};
}

export type IntervalsErrorCode = "NOT_CONNECTED" | "TOKEN_EXPIRED" | "UPSTREAM_ERROR";

export class IntervalsAuthError extends Error {
	constructor(
		message: string,
		public readonly code: IntervalsErrorCode,
	) {
		super(message);
		this.name = "IntervalsAuthError";
	}
}

export const buildIntervalsTokenData = (data: IntervalsTokenResponse) => {
	// expires_in が明示的に指定されている場合のみ有効期限を算出
	// 指定がない場合は長期間/無期限有効（またはAPIキー相当）として null をセット
	return {
		intervalsExpiresAt: data.expires_in
			? new Date(Date.now() + data.expires_in * 1000)
			: null,
	};
};

interface IntervalsActivity {
	id: string;
	name: string;
	type: string;
	distance: number; // in meters
	start_date?: string; // UTC ISO-8601
	start_date_local?: string; // ISO-8601
}

const INTERVALS_CLIENT_ID = process.env.INTERVALS_CLIENT_ID;
const INTERVALS_CLIENT_SECRET = process.env.INTERVALS_CLIENT_SECRET;

// 環境に応じてリダイレクト先を自動切り替え
const INTERVALS_REDIRECT_URI =
	process.env.NODE_ENV === "development"
		? "http://localhost:3000/api/intervals/callback"
		: process.env.INTERVALS_REDIRECT_URI;

if (!INTERVALS_CLIENT_ID || !INTERVALS_CLIENT_SECRET) {
	throw new Error(
		"INTERVALS_CLIENT_ID and INTERVALS_CLIENT_SECRET environment variables are required",
	);
}

export const getIntervalsAuthUrl = () => {
	const params = new URLSearchParams({
		client_id: INTERVALS_CLIENT_ID,
		redirect_uri: INTERVALS_REDIRECT_URI || "http://localhost:3000/api/intervals/callback",
		response_type: "code",
		scope: "ACTIVITY:READ",
	});
	return `https://intervals.icu/oauth/authorize?${params.toString()}`;
};

export const exchangeIntervalsCodeForToken = async (
	code: string,
): Promise<IntervalsTokenResponse> => {
	const params = new URLSearchParams();
	params.append("client_id", INTERVALS_CLIENT_ID);
	params.append("client_secret", INTERVALS_CLIENT_SECRET);
	params.append("code", code);
	params.append("grant_type", "authorization_code");
	if (INTERVALS_REDIRECT_URI) {
		params.append("redirect_uri", INTERVALS_REDIRECT_URI);
	}

	const response = await fetch("https://intervals.icu/api/oauth/token", {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: params.toString(),
	});

	if (!response.ok) {
		const text = await response.text();
		console.error("Failed to exchange code for token:", text);
		throw new Error("Failed to exchange code for token");
	}

	return response.json();
};

export const refreshIntervalsToken = async (userId: string): Promise<string> => {
	const user = await prisma.user.findUnique({ where: { id: userId } });

	if (!user) {
		throw new IntervalsAuthError("User not found", "NOT_CONNECTED");
	}

	const { refreshToken } = await getIntervalsTokensFromClerk(userId);

	if (!refreshToken) {
		throw new IntervalsAuthError("User not connected to Intervals.icu or refresh token not found", "NOT_CONNECTED");
	}

	const params = new URLSearchParams();
	params.append("client_id", INTERVALS_CLIENT_ID);
	params.append("client_secret", INTERVALS_CLIENT_SECRET);
	params.append("refresh_token", refreshToken);
	params.append("grant_type", "refresh_token");

	let response: Response;
	try {
		response = await fetch("https://intervals.icu/api/oauth/token", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: params.toString(),
		});
	} catch (networkErr) {
		console.error("Network error refreshing Intervals.icu token:", networkErr);
		throw new IntervalsAuthError("Network failure connecting to Intervals.icu", "UPSTREAM_ERROR");
	}

	if (!response.ok) {
		const text = await response.text();
		console.error("Failed to refresh token:", text);
		if (response.status === 400 || response.status === 401) {
			throw new IntervalsAuthError("Intervals.icu refresh token expired or revoked. Please reconnect.", "TOKEN_EXPIRED");
		}
		throw new IntervalsAuthError("Upstream error while refreshing token with Intervals.icu", "UPSTREAM_ERROR");
	}

	const data: IntervalsTokenResponse = await response.json();

	// Clerk の privateMetadata に新しいトークンを退避保存
	await saveIntervalsTokensToClerk(userId, data);

	// DB側は有効期限のみ更新
	await prisma.user.update({
		where: { id: userId },
		data: buildIntervalsTokenData(data),
	});

	return data.access_token;
};

/**
 * Intervals.icu アクティビティの開始日時を Date オブジェクトに変換
 * UTC ISO文字列の start_date を優先使用し、存在しない場合 start_date_local をフォールバック利用
 */
export const getIntervalsActivityDate = (intervalsAct: IntervalsActivity): Date => {
	if (intervalsAct.start_date) {
		return new Date(intervalsAct.start_date);
	}
	if (intervalsAct.start_date_local) {
		return new Date(intervalsAct.start_date_local);
	}
	return new Date();
};

/**
 * Intervals.icuのアクティビティタイプをPrismaの型に変換
 */
export const mapIntervalsTypeToPrisma = (type: string): ActivityType | null => {
	switch (type) {
		case "Run":
		// case "VirtualRun":
			return ActivityType.Run;
		case "Walk":
		case "Hike":
			return ActivityType.Walk;
		case "Ride":
		// case "VirtualRide":
			return ActivityType.Ride;
		default:
			return null;
	}
};

/**
 * ポイント計算ロジック
 * ウォーキング: 1km = 1pt
 * ランニング: 1km = 1.5pt
 * 自転車: 1km = 0.5pt
 * 上限: 100pt / アクティビティ
 */
export const calculatePoints = (
	type: ActivityType,
	distanceInMeters: number,
): number => {
	const distanceKm = distanceInMeters / 1000;
	let multiplier = 0;

	switch (type) {
		case ActivityType.Run:
			multiplier = 1.5;
			break;
		case ActivityType.Walk:
			multiplier = 1.0;
			break;
		case ActivityType.Ride:
			multiplier = 0.5;
			break;
	}

	const points = Math.floor(distanceKm * multiplier);
	return Math.min(points, 100); // 100pt上限
};

/**
 * アクティビティの取得 (最新100件)
 */
export const getIntervalsActivities = async (
	accessToken: string,
	athleteId: string,
	oldestDateStr: string, // YYYY-MM-DD
): Promise<IntervalsActivity[]> => {
	const url = `https://intervals.icu/api/v1/athlete/${athleteId}/activities?oldest=${oldestDateStr}`;
	const response = await fetch(url, {
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
	});

	if (!response.ok) {
		const text = await response.text();
		console.error("Failed to fetch Intervals.icu activities:", text);
		throw new Error("Failed to fetch Intervals.icu activities");
	}

	return response.json();
};

/**
 * 特定のアクティビティを取得
 */
export const getIntervalsActivityById = async (
	accessToken: string,
	athleteId: string,
	activityId: string,
): Promise<IntervalsActivity> => {
	const response = await fetch(
		`https://intervals.icu/api/v1/athlete/${athleteId}/activity/${activityId}`,
		{
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		},
	);

	if (!response.ok) {
		const text = await response.text();
		console.error(`Failed to fetch Intervals.icu activity ${activityId}:`, text);
		throw new Error("Failed to fetch Intervals.icu activity");
	}

	return response.json();
};

/**
 * 同一アクティビティ（重複）と見なせる既存アクティビティを検索する
 * 条件: 開始日時が前後24時間以内、アクティビティタイプが同じ、距離の差が0.1km未満または2%未満
 */
const findDuplicateActivity = async (
	tx: any,
	userId: string,
	params: {
		type: ActivityType;
		distanceKm: number;
		activityDate: Date;
	},
) => {
	const margin = 24 * 60 * 60 * 1000; // 24時間
	const minDate = new Date(params.activityDate.getTime() - margin);
	const maxDate = new Date(params.activityDate.getTime() + margin);

	const candidates = await tx.activity.findMany({
		where: {
			userId: userId,
			activityType: params.type,
			activityDate: {
				gte: minDate,
				lte: maxDate,
			},
		},
	});

	return candidates.find((c: any) => {
		const distanceDiff = Math.abs(c.distance - params.distanceKm);
		const maxAllowedDiff = Math.max(0.1, params.distanceKm * 0.02);
		return distanceDiff < maxAllowedDiff;
	});
};

/**
 * 有効な Intervals.icu アクセストークンを取得する
 * 期限切れトークンは決して返却せず、リフレッシュ不可または失敗時は明確なエラーを投げる
 */
export const getValidIntervalsAccessToken = async (
	userId: string,
	expiresAt: Date | null,
): Promise<string> => {
	const { accessToken, refreshToken } = await getIntervalsTokensFromClerk(userId);

	if (!accessToken && !refreshToken) {
		throw new IntervalsAuthError("Intervals.icu tokens not found", "NOT_CONNECTED");
	}

	// expiresAt が明示的に記録されている場合のみ期限切れチェック (5分前マージン)
	// expiresAt が null の場合は無期限/APIキー相当として扱う
	const isExpired = expiresAt ? expiresAt.getTime() < Date.now() + 5 * 60 * 1000 : false;

	if (isExpired) {
		if (!refreshToken) {
			// 期限切れだがリフレッシュトークンがない場合、古いトークンは絶対に返却せず再連携を要求
			throw new IntervalsAuthError(
				"Intervals.icu token has expired and no refresh token is available. Reconnection required.",
				"TOKEN_EXPIRED",
			);
		}

		// リフレッシュを試行（失敗時は IntervalsAuthError がそのまま伝播する）
		return await refreshIntervalsToken(userId);
	}

	// 期限内（または expiresAt が null）でアクセストークンが存在する場合
	if (accessToken) {
		return accessToken;
	}

	// アクセストークンがなくリフレッシュトークンのみ存在する場合
	if (refreshToken) {
		return await refreshIntervalsToken(userId);
	}

	throw new IntervalsAuthError("No valid Intervals.icu access token available", "NOT_CONNECTED");
};

/**
 * 特定のアクティビティを同期する (Webhook用)
 */
export const syncSingleIntervalsActivity = async (
	intervalsAthleteId: string,
	intervalsActivityId: string,
): Promise<{ success: boolean; message?: string; activityId?: string; error?: unknown }> => {
	console.log(`[Intervals Sync] Starting sync for Athlete: ${intervalsAthleteId}, Activity: ${intervalsActivityId}`);

	// アスリートIDからユーザーを特定
	const user = await prisma.user.findFirst({
		where: { intervalsAthleteId: intervalsAthleteId.toString() },
	});

	if (!user) {
		console.error(`[Intervals Sync] User not found for athlete ID: ${intervalsAthleteId}`);
		return { success: false, message: "User not found" };
	}

	if (!user.intervalsConnected) {
		console.error(`[Intervals Sync] User ${user.id} is not connected to Intervals.icu`);
		return { success: false, message: "Intervals.icu not connected" };
	}

	let accessToken: string;
	try {
		accessToken = await getValidIntervalsAccessToken(user.id, user.intervalsExpiresAt);
	} catch (tokenErr) {
		console.error(`[Intervals Sync] Failed to get valid token for user ${user.id}:`, tokenErr);
		return { success: false, message: "Intervals token invalid or expired" };
	}

	try {
		console.log(`[Intervals Sync] Fetching activity ${intervalsActivityId} from Intervals.icu API`);
		const intervalsAct = await getIntervalsActivityById(
			accessToken,
			intervalsAthleteId,
			intervalsActivityId,
		);

		const type = mapIntervalsTypeToPrisma(intervalsAct.type);
		if (!type) {
			console.log(`[Intervals Sync] Activity ${intervalsActivityId} has unsupported type: ${intervalsAct.type}`);
			return { success: false, message: "Unsupported activity type" };
		}

		const pointsToAward = calculatePoints(type, intervalsAct.distance);
		const distanceKm = intervalsAct.distance / 1000;

		console.log(`[Intervals Sync] Saving activity to DB: ${intervalsAct.name} (${distanceKm.toFixed(2)}km, ${pointsToAward}pts)`);

		// 既存のアクティビティを確認（現在の獲得ポイントを知るため）
		let existingActivity = await prisma.activity.findUnique({
			where: { intervalsActivityId: intervalsAct.id.toString() },
		});

		// 重複チェック（日時と距離から同一アクティビティを検出）
		if (!existingActivity) {
			const duplicate = await findDuplicateActivity(prisma, user.id, {
				type,
				distanceKm,
				activityDate: getIntervalsActivityDate(intervalsAct),
			});
			if (duplicate) {
				existingActivity = duplicate;
			}
		}

		if (existingActivity) {
			const newPointsToCreate = pointsToAward - existingActivity.pointsAwarded;

			await prisma.activity.update({
				where: { id: existingActivity.id },
				data: {
					intervalsActivityId: intervalsAct.id.toString(),
					pointsAwarded: Math.max(existingActivity.pointsAwarded, pointsToAward),
					points:
						newPointsToCreate > 0
							? {
									create: {
										userId: user.id,
										points: newPointsToCreate,
										description: `Intervals Webhook Update: ${intervalsAct.name}`,
									},
								}
							: undefined,
				},
			});
		} else {
			await prisma.activity.create({
				data: {
					userId: user.id,
					intervalsActivityId: intervalsAct.id.toString(),
					activityType: type,
					distance: distanceKm,
					activityDate: getIntervalsActivityDate(intervalsAct),
					pointsAwarded: pointsToAward,
					points:
						pointsToAward > 0
							? {
									create: {
										userId: user.id,
										points: pointsToAward,
										description: `Intervals Webhook Sync: ${intervalsAct.name}`,
									},
								}
							: undefined,
				},
			});
		}

		// バッジ獲得をチェック
		console.log(`[Intervals Sync] Checking badges for user ${user.id}`);
		await checkAndAwardBadges(user.id);

		console.log(`[Intervals Sync] Successfully synced activity ${intervalsActivityId}`);
		return { success: true, activityId: intervalsAct.id.toString() };
	} catch (error) {
		console.error(`[Intervals Sync] Error syncing single activity ${intervalsActivityId}:`, error);
		return { success: false, error };
	}
};

export interface SyncIntervalsActivityResult {
	success: boolean;
	message?: string;
	errorType?: IntervalsErrorCode;
	newActivitiesCount?: number;
	pointsAwardedTotal?: number;
	co2ReductionDelta?: number;
	newBadges?: BadgeDefinition[];
	newActivityIds?: string[];
}

/**
 * ユーザーのアクティビティを同期する
 */
export const syncIntervalsActivities = async (
	userId: string,
): Promise<SyncIntervalsActivityResult> => {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		include: {
			activities: {
				orderBy: { activityDate: "desc" },
				take: 1,
			},
		},
	});

	if (!user || !user.intervalsConnected || !user.intervalsAthleteId) {
		return {
			success: false,
			message: "Intervals.icu not connected",
			errorType: "NOT_CONNECTED",
		};
	}

	let accessToken: string;
	try {
		accessToken = await getValidIntervalsAccessToken(userId, user.intervalsExpiresAt);
	} catch (tokenErr) {
		console.error(`[Intervals Sync] Failed to get valid token for user ${userId}:`, tokenErr);
		if (tokenErr instanceof IntervalsAuthError) {
			return {
				success: false,
				message: tokenErr.message,
				errorType: tokenErr.code,
			};
		}
		return {
			success: false,
			message: "Intervals.icu token unavailable",
			errorType: "UPSTREAM_ERROR",
		};
	}

	// 最後に同期したアクティビティの時間を取得 (なければ30日前から)
	const lastActivityDate = user.activities[0]?.activityDate;
	const oldestDate = lastActivityDate
		? new Date(lastActivityDate.getTime() - 7 * 24 * 60 * 60 * 1000) // 7日間前からチェックして抜け漏れを確実に防ぐ
		: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

	const oldestDateStr = oldestDate.toISOString().split("T")[0];

	let rawActivities: IntervalsActivity[];
	try {
		rawActivities = await getIntervalsActivities(accessToken, user.intervalsAthleteId, oldestDateStr);
	} catch (apiErr) {
		console.error(`[Intervals Sync] Failed to fetch activities from Intervals.icu:`, apiErr);
		return {
			success: false,
			message: "Failed to fetch activities from Intervals.icu upstream",
			errorType: "UPSTREAM_ERROR",
		};
	}

	console.log(
		`Fetched ${rawActivities.length} activities from Intervals.icu since ${oldestDateStr}`,
	);

	// 重複を除去しつつ保存
	let newActivitiesCount = 0;
	let pointsAwardedTotal = 0;
	let co2ReductionDelta = 0;
	const newActivityIds: string[] = [];

	for (const intervalsAct of rawActivities) {
		const type = mapIntervalsTypeToPrisma(intervalsAct.type);
		if (process.env.NODE_ENV === "development") {
			console.log(
				`Processing activity: ${intervalsAct.name}, Type: ${intervalsAct.type}, Mapped Type: ${type}, Distance: ${intervalsAct.distance}m`,
			);
		}

		if (!type) {
			console.log(
				`Activity ${intervalsAct.id} skipped: unsupported type ${intervalsAct.type}`,
			);
			continue;
		}

		const distanceKm = intervalsAct.distance / 1000;
		const pointsToAward = calculatePoints(type, intervalsAct.distance);

		let existing = await prisma.activity.findUnique({
			where: { intervalsActivityId: intervalsAct.id.toString() },
		});

		if (!existing) {
			const duplicate = await findDuplicateActivity(prisma, userId, {
				type,
				distanceKm,
				activityDate: getIntervalsActivityDate(intervalsAct),
			});
			if (duplicate) {
				existing = duplicate;
			}
		}

		if (existing) {
			// すでに存在するが、intervalsActivityIdが未設定の場合は紐付けを更新
			if (!existing.intervalsActivityId) {
				const newPointsToCreate = pointsToAward - existing.pointsAwarded;
				await prisma.activity.update({
					where: { id: existing.id },
					data: {
						intervalsActivityId: intervalsAct.id.toString(),
						pointsAwarded: Math.max(existing.pointsAwarded, pointsToAward),
						points:
							newPointsToCreate > 0
								? {
										create: {
											userId: userId,
											points: newPointsToCreate,
											description: `Intervals Sync Update: ${intervalsAct.name}`,
										},
									}
								: undefined,
					},
				});
			}
			continue; // Already synced or merged
		}

		const created = await prisma.activity.create({
			data: {
				userId: userId,
				intervalsActivityId: intervalsAct.id.toString(),
				activityType: type,
				distance: distanceKm,
				activityDate: getIntervalsActivityDate(intervalsAct),
				pointsAwarded: pointsToAward,
				points:
					pointsToAward > 0
						? {
								create: {
									userId: userId,
									points: pointsToAward,
									description: `Intervals Sync: ${intervalsAct.name}`,
								},
							}
						: undefined,
			},
		});

		newActivitiesCount++;
		pointsAwardedTotal += pointsToAward;
		co2ReductionDelta += calculateCO2Reduction(distanceKm);
		newActivityIds.push(created.id);
	}

	// Check for badges (non-fatal if it fails)
	let newBadges: BadgeDefinition[] = [];
	if (newActivitiesCount > 0) {
		try {
			newBadges = await checkAndAwardBadges(userId);
		} catch (badgeError) {
			console.error("Badge check failed (non-fatal):", badgeError);
		}
	}

	return {
		success: true,
		newActivitiesCount,
		pointsAwardedTotal,
		co2ReductionDelta,
		newBadges,
		newActivityIds,
	};
};
