import { auth } from "@clerk/nextjs/server";
import { ActivityType } from "@prisma/client";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST() {
	const { userId } = await auth();

	if (!userId) {
		return new NextResponse("Unauthorized", { status: 401 });
	}

	try {
		// 1. ユーザーをDBに作成/取得
		const user = await prisma.user.upsert({
			where: { id: userId },
			update: {},
			create: {
				id: userId,
				email: `${userId}@example.com`,
				name: "Demo Athlete",
				stravaConnected: false, // 連携はさせない
			},
		});

		// 2. 既存のアクティビティがあるかチェック（二重生成防止）
		const existingCount = await prisma.activity.count({
			where: { userId },
		});

		if (existingCount > 0) {
			return NextResponse.json({
				success: true,
				message: "Already has demo data",
			});
		}

		// 3. 過去180日分のアクティビティを生成 (ランダムに40-60件程度)
		const activities = [];
		const _points = [];
		const now = new Date();

		for (let i = 0; i < 180; i++) {
			// 3日に1回程度の頻度でアクティビティを生成
			if (Math.random() > 0.3) continue;

			const date = new Date(now);
			date.setDate(date.getDate() - i);

			// 修正したカレンダーのテスト用に、あえて深夜〜早朝の時間帯も混ぜる
			date.setHours(
				Math.floor(Math.random() * 24),
				Math.floor(Math.random() * 60),
			);

			const types = [ActivityType.Run, ActivityType.Ride, ActivityType.Walk];
			const type = types[Math.floor(Math.random() * types.length)];

			// タイプに応じた現実的な距離
			let distance = 0;
			let multiplier = 0;
			if (type === ActivityType.Run) {
				distance = Math.random() * 8 + 3; // 3-11km
				multiplier = 1.5;
			} else if (type === ActivityType.Ride) {
				distance = Math.random() * 30 + 10; // 10-40km
				multiplier = 0.5;
			} else {
				distance = Math.random() * 5 + 1; // 1-6km
				multiplier = 1.0;
			}

			const pointsAwarded = Math.floor(distance * multiplier);

			activities.push({
				userId,
				stravaActivityId: `demo-${userId}-${i}`,
				activityType: type,
				distance: distance,
				activityDate: date,
				pointsAwarded: pointsAwarded,
			});
		}

		// 一括登録 (transaction)
		await prisma.$transaction(async (tx) => {
			for (const act of activities) {
				await tx.activity.create({
					data: {
						...act,
						points:
							act.pointsAwarded > 0
								? {
										create: {
											userId,
											points: act.pointsAwarded,
											description: `Demo Activity: ${act.activityType}`,
										},
									}
								: undefined,
					},
				});
			}
		});

		return NextResponse.json({
			success: true,
			count: activities.length,
		});
	} catch (error) {
		console.error("Demo seed error:", error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
