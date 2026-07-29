import { auth, currentUser } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
	buildIntervalsTokenData,
	calculatePoints,
	exchangeIntervalsCodeForToken,
	getIntervalsActivities,
	getIntervalsActivityDate,
	mapIntervalsTypeToPrisma,
} from "@/lib/intervals";

export async function GET(request: NextRequest) {
	const { userId } = await auth();
	const searchParams = request.nextUrl.searchParams;
	const code = searchParams.get("code");
	const error = searchParams.get("error");

	if (error) {
		return NextResponse.redirect(
			new URL("/?error=intervals_access_denied", request.url),
		);
	}

	if (!code || !userId) {
		return NextResponse.redirect(new URL("/", request.url));
	}

	try {
		const data = await exchangeIntervalsCodeForToken(code);
		const user = await currentUser();
		const tokenData = buildIntervalsTokenData(data);

		// 1. ユーザー情報の更新/作成
		await prisma.user.upsert({
			where: { id: userId },
			update: {
				intervalsConnected: true,
				intervalsAthleteId: data.athlete.id.toString(),
				...tokenData,
			},
			create: {
				id: userId,
				email: user?.emailAddresses[0].emailAddress || "",
				name: user?.firstName || null,
				intervalsConnected: true,
				intervalsAthleteId: data.athlete.id.toString(),
				...tokenData,
			},
		});

		// 2. 初期同期: 過去1ヶ月分のアクティビティを取得 (最大100件)
		const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
		const oldestDateStr = thirtyDaysAgo.toISOString().split("T")[0];
		
		const rawActivities = await getIntervalsActivities(
			data.access_token,
			data.athlete.id.toString(),
			oldestDateStr,
		);

		// 最新のアクティビティから順に処理するためにソート
		const sortedActivities = [...rawActivities].sort(
			(a, b) =>
				getIntervalsActivityDate(b).getTime() - getIntervalsActivityDate(a).getTime(),
		);

		let totalInitialPointsAwarded = 0;
		const MAX_INITIAL_SYNC_POINTS = 100;

		for (const intervalsAct of sortedActivities) {
			const type = mapIntervalsTypeToPrisma(intervalsAct.type);
			if (!type) continue; // 対象外のタイプはスキップ

			const potentialPoints = calculatePoints(type, intervalsAct.distance);

			const remainingAllowance = Math.max(
				0,
				MAX_INITIAL_SYNC_POINTS - totalInitialPointsAwarded,
			);
			const pointsToAward = Math.min(potentialPoints, remainingAllowance);

			totalInitialPointsAwarded += pointsToAward;

			await prisma.activity.upsert({
				where: { intervalsActivityId: intervalsAct.id.toString() },
				update: {}, // すでに存在すれば何もしない
				create: {
					userId: userId,
					intervalsActivityId: intervalsAct.id.toString(),
					activityType: type,
					distance: intervalsAct.distance / 1000, // km
					activityDate: getIntervalsActivityDate(intervalsAct),
					eligibleForPoints: true,
					pointsAwarded: pointsToAward,
					points:
						pointsToAward > 0
							? {
									create: {
										userId: userId,
										points: pointsToAward,
										description: `Initial Sync Bonus (Intervals): ${intervalsAct.name}`,
									},
								}
							: undefined,
				},
			});
		}

		return NextResponse.redirect(
			new URL("/dashboard?success=intervals_connected", request.url),
		);
	} catch (err) {
		console.error("Intervals callback error:", err);
		return NextResponse.redirect(
			new URL("/?error=intervals_connection_failed", request.url),
		);
	}
}
