import { ActivityType } from "@prisma/client";
import { checkAndAwardBadges } from "./badge-service";
import { BadgeDefinition } from "./badges";
import { calculateCO2Reduction } from "./eco-utils";
import prisma from "./prisma";

interface StravaTokenResponse {
	access_token: string;
	refresh_token: string;
	expires_in: number;
	athlete: {
		id: number;
	};
}

interface StravaActivity {
	id: number;
	name: string;
	type: string;
	distance: number;
	start_date: string;
}

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;

// 環境に応じてリダイレクト先を自動切り替え
const STRAVA_REDIRECT_URI =
	process.env.NODE_ENV === "development"
		? "http://localhost:3000/api/strava/callback"
		: process.env.STRAVA_REDIRECT_URI;

if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET) {
	throw new Error(
		"STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET environment variables are required",
	);
}

if (!STRAVA_REDIRECT_URI) {
	throw new Error(
		"STRAVA_REDIRECT_URI environment variable is required in production",
	);
}

export const getStravaAuthUrl = () => {
	const params = new URLSearchParams({
		client_id: STRAVA_CLIENT_ID,
		redirect_uri: STRAVA_REDIRECT_URI,
		response_type: "code",
		approval_prompt: "auto",
		scope: "read,activity:read_all",
	});
	return `https://www.strava.com/oauth/authorize?${params.toString()}`;
};

export const exchangeStravaCodeForToken = async (
	code: string,
): Promise<StravaTokenResponse> => {
	const response = await fetch("https://www.strava.com/oauth/token", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			client_id: STRAVA_CLIENT_ID,
			client_secret: STRAVA_CLIENT_SECRET,
			code,
			grant_type: "authorization_code",
		}),
	});

	if (!response.ok) {
		throw new Error("Failed to exchange code for token");
	}

	return response.json();
};

export const refreshStravaToken = async (userId: string): Promise<string> => {
	const user = await prisma.user.findUnique({ where: { id: userId } });

	if (!user || !user.stravaRefreshToken) {
		throw new Error("User not found or not connected to Strava");
	}

	const response = await fetch("https://www.strava.com/oauth/token", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			client_id: STRAVA_CLIENT_ID,
			client_secret: STRAVA_CLIENT_SECRET,
			refresh_token: user.stravaRefreshToken,
			grant_type: "refresh_token",
		}),
	});

	if (!response.ok) {
		throw new Error("Failed to refresh token");
	}

	const data: StravaTokenResponse = await response.json();

	await prisma.user.update({
		where: { id: userId },
		data: {
			stravaAccessToken: data.access_token,
			stravaRefreshToken: data.refresh_token,
			stravaExpiresAt: new Date(Date.now() + data.expires_in * 1000),
		},
	});

	return data.access_token;
};

// --- 追加機能 ---

/**
 * StravaのアクティビティタイプをPrismaの型に変換
 */
export const mapStravaTypeToPrisma = (type: string): ActivityType | null => {
	switch (type) {
		case "Run":
			return ActivityType.Run;
		case "Walk":
		case "Hike":
			return ActivityType.Walk;
		case "Ride":
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
export const getStravaActivities = async (
	accessToken: string,
	afterTimestamp: number,
): Promise<StravaActivity[]> => {
	const response = await fetch(
		`https://www.strava.com/api/v3/athlete/activities?after=${afterTimestamp}&per_page=100`,
		{
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		},
	);

	if (!response.ok) {
		throw new Error("Failed to fetch Strava activities");
	}

	return response.json();
};

/**
 * 特定のアクティビティを取得
 */
export const getStravaActivityById = async (
	accessToken: string,
	activityId: string,
): Promise<StravaActivity> => {
	const response = await fetch(
		`https://www.strava.com/api/v3/activities/${activityId}`,
		{
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		},
	);

	if (!response.ok) {
		throw new Error("Failed to fetch Strava activity");
	}

	return response.json();
};

/**
 * 特定のアクティビティを同期する (Webhook用)
 */
export const syncSingleActivity = async (
	stravaAthleteId: string,
	stravaActivityId: string,
): Promise<{ success: boolean; message?: string; activityId?: number; error?: unknown }> => {
	// アスリートIDからユーザーを特定
	const user = await prisma.user.findFirst({
		where: { stravaAthleteId: stravaAthleteId.toString() },
	});

	if (!user || !user.stravaConnected || !user.stravaAccessToken) {
		console.error(`User not found for athlete ID: ${stravaAthleteId}`);
		return { success: false, message: "User not found" };
	}

	let accessToken = user.stravaAccessToken;

	// トークンの有効期限チェック
	if (
		!user.stravaExpiresAt ||
		user.stravaExpiresAt.getTime() < Date.now() + 5 * 60 * 1000
	) {
		accessToken = await refreshStravaToken(user.id);
	}

	try {
		const stravaAct = await getStravaActivityById(
			accessToken,
			stravaActivityId,
		);
		const type = mapStravaTypeToPrisma(stravaAct.type);

		if (!type) {
			return { success: false, message: "Unsupported activity type" };
		}

		const pointsToAward = calculatePoints(type, stravaAct.distance);

		await prisma.activity.upsert({
			where: { stravaActivityId: stravaAct.id.toString() },
			update: {
				// 更新があった場合も考慮（距離の微修正など）
				activityType: type,
				distance: stravaAct.distance / 1000,
				pointsAwarded: pointsToAward,
			},
			create: {
				userId: user.id,
				stravaActivityId: stravaAct.id.toString(),
				activityType: type,
				distance: stravaAct.distance / 1000,
				activityDate: new Date(stravaAct.start_date),
				pointsAwarded: pointsToAward,
				points:
					pointsToAward > 0
						? {
								create: {
									userId: user.id,
									points: pointsToAward,
									description: `Webhook Sync: ${stravaAct.name}`,
								},
							}
						: undefined,
			},
		});

		// バッジ獲得をチェック
		await checkAndAwardBadges(user.id);

		return { success: true, activityId: stravaAct.id };
	} catch (error) {
		console.error("Error syncing single activity:", error);
		return { success: false, error };
	}
};

/**
 * ユーザーのアクティビティを同期する
 */
export const syncActivities = async (userId: string): Promise<{
	success: boolean;
	message?: string;
	newActivitiesCount?: number;
	pointsAwardedTotal?: number;
	co2ReductionDelta?: number;
	newBadges?: BadgeDefinition[];
}> => {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		include: {
			activities: {
				orderBy: { activityDate: "desc" },
				take: 1,
			},
		},
	});

	if (!user || !user.stravaConnected || !user.stravaAccessToken) {
		return { success: false, message: "Strava not connected" };
	}

	let accessToken = user.stravaAccessToken;

	// トークンの有効期限チェック (余裕を持って5分前)
	if (
		!user.stravaExpiresAt ||
		user.stravaExpiresAt.getTime() < Date.now() + 5 * 60 * 1000
	) {
		accessToken = await refreshStravaToken(userId);
	}

	// 最後に同期したアクティビティの時間を取得 (なければ30日前から)
	const lastActivityDate = user.activities[0]?.activityDate;
	const afterTimestamp = lastActivityDate
		? Math.floor(lastActivityDate.getTime() / 1000) - 7 * 24 * 60 * 60 // 7日間前からチェックして抜け漏れを確実に防ぐ
		: Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;

	const rawActivities = await getStravaActivities(accessToken, afterTimestamp);
	console.log(
		`Fetched ${rawActivities.length} activities from Strava since ${new Date(afterTimestamp * 1000).toISOString()}`,
	);

	// 重複を除去しつつ保存
	let newActivitiesCount = 0;
	let pointsAwardedTotal = 0;
	let co2ReductionDelta = 0;

	for (const stravaAct of rawActivities) {
		const type = mapStravaTypeToPrisma(stravaAct.type);
		if (process.env.NODE_ENV === "development") {
			console.log(
				`Processing activity: ${stravaAct.name}, Type: ${stravaAct.type}, Mapped Type: ${type}, Distance: ${stravaAct.distance}m`,
			);
		}

		if (!type) {
			console.log(
				`Activity ${stravaAct.id} skipped: unsupported type ${stravaAct.type}`,
			);
			continue;
		}

		const distanceKm = stravaAct.distance / 1000;
		const pointsToAward = calculatePoints(type, stravaAct.distance);

		const existing = await prisma.activity.findUnique({
			where: { stravaActivityId: stravaAct.id.toString() },
		});
		if (existing) {
			continue; // Already synced
		}

		await prisma.activity.upsert({
			where: { stravaActivityId: stravaAct.id.toString() },
			update: {}, // 既に存在する場合は更新しない
			create: {
				userId: userId,
				stravaActivityId: stravaAct.id.toString(),
				activityType: type,
				distance: distanceKm,
				activityDate: new Date(stravaAct.start_date),
				pointsAwarded: pointsToAward,
				points:
					pointsToAward > 0
						? {
								create: {
									userId: userId,
									points: pointsToAward,
									description: `Activity Sync: ${stravaAct.name}`,
								},
							}
						: undefined,
			},
		});

		newActivitiesCount++;
		pointsAwardedTotal += pointsToAward;
		co2ReductionDelta += calculateCO2Reduction(distanceKm);
	}

	// バッジ獲得をチェック（失敗してもアクティビティ同期結果は返す）
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
	};
};
