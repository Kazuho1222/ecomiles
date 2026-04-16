import { auth, currentUser } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
	calculatePoints,
	exchangeStravaCodeForToken,
	getStravaActivities,
	mapStravaTypeToPrisma,
} from "@/lib/strava";

export async function GET(request: NextRequest) {
	const { userId } = await auth();
	const searchParams = request.nextUrl.searchParams;
	const code = searchParams.get("code");
	const error = searchParams.get("error");

	if (error) {
		return NextResponse.redirect(
			new URL("/?error=strava_access_denied", request.url),
		);
	}

	if (!code || !userId) {
		return NextResponse.redirect(new URL("/", request.url));
	}

	try {
		const data = await exchangeStravaCodeForToken(code);
		const user = await currentUser();

		// 1. ユーザー情報の更新/作成
		await prisma.user.upsert({
			where: { id: userId },
			update: {
				stravaConnected: true,
				stravaAthleteId: data.athlete.id.toString(),
				stravaAccessToken: data.access_token,
				stravaRefreshToken: data.refresh_token,
				stravaExpiresAt: new Date(Date.now() + data.expires_in * 1000),
			},
			create: {
				id: userId,
				email: user?.emailAddresses[0].emailAddress || "",
				name: user?.firstName || null,
				stravaConnected: true,
				stravaAthleteId: data.athlete.id.toString(),
				stravaAccessToken: data.access_token,
				stravaRefreshToken: data.refresh_token,
				stravaExpiresAt: new Date(Date.now() + data.expires_in * 1000),
			},
		});

		// 2. 初期同期: 過去1ヶ月分のアクティビティを取得 (最大100件)
		const oneMonthAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
		const rawActivities = await getStravaActivities(
			data.access_token,
			oneMonthAgo,
		);

		// 最新のアクティビティから順に処理するためにソート (Strava API は古い順で返す場合があるため)
		const sortedActivities = rawActivities.sort(
			(a: { start_date: string }, b: { start_date: string }) =>
				new Date(b.start_date).getTime() - new Date(a.start_date).getTime(),
		);

		let totalInitialPointsAwarded = 0;
		const MAX_INITIAL_SYNC_POINTS = 100;

		for (const stravaAct of sortedActivities) {
			const type = mapStravaTypeToPrisma(stravaAct.type);
			if (!type) continue; // 対象外のタイプはスキップ

			// このアクティビティで獲得可能なポイントを計算
			const potentialPoints = calculatePoints(type, stravaAct.distance);

			// 残りの付与枠を計算
			const remainingAllowance = Math.max(
				0,
				MAX_INITIAL_SYNC_POINTS - totalInitialPointsAwarded,
			);
			const pointsToAward = Math.min(potentialPoints, remainingAllowance);

			totalInitialPointsAwarded += pointsToAward;

			// アクティビティとポイントを保存
			await prisma.activity.upsert({
				where: { stravaActivityId: stravaAct.id.toString() },
				update: {}, // すでに存在すれば何もしない
				create: {
					userId: userId,
					stravaActivityId: stravaAct.id.toString(),
					activityType: type,
					distance: stravaAct.distance / 1000, // km
					activityDate: new Date(stravaAct.start_date),
					eligibleForPoints: true,
					pointsAwarded: pointsToAward,
					points:
						pointsToAward > 0
							? {
									create: {
										userId: userId,
										points: pointsToAward,
										description: `Initial Sync Bonus: ${stravaAct.name}`,
									},
								}
							: undefined,
				},
			});
		}

		return NextResponse.redirect(
			new URL("/dashboard?success=strava_connected", request.url),
		);
	} catch (err) {
		console.error("Strava callback error:", err);
		return NextResponse.redirect(
			new URL("/?error=strava_connection_failed", request.url),
		);
	}
}
