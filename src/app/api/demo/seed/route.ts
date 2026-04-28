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
		await prisma.user.upsert({
			where: { id: userId },
			update: {},
			create: {
				id: userId,
				email: `${userId}@example.com`,
				name: "Demo Athlete",
				stravaConnected: false,
			},
		});

		// 2. 既存のアクティビティの状態をチェック
		const activities = await prisma.activity.findMany({
			where: { userId },
			select: { stravaActivityId: true },
		});

		const hasRealActivities = activities.some(
			(a) => !a.stravaActivityId.startsWith("demo-"),
		);
		const hasDemoActivities = activities.some((a) =>
			a.stravaActivityId.startsWith("demo-"),
		);

		// 本物のアクティビティがある場合は、データを混ぜないように拒否
		if (hasRealActivities) {
			return NextResponse.json(
				{
					success: false,
					message:
						"Cannot seed demo data into an account with real activities.",
				},
				{ status: 400 },
			);
		}

		// 既にデモデータがある場合は、重複して作らない
		if (hasDemoActivities) {
			return NextResponse.json({
				success: true,
				message: "Already in demo mode.",
			});
		}

		// 3. 過去180日分のアクティビティを生成
		const newActivities: {
			userId: string;
			stravaActivityId: string;
			activityType: ActivityType;
			distance: number;
			activityDate: Date;
			pointsAwarded: number;
		}[] = [];
		const now = new Date();

		for (let i = 0; i < 180; i++) {
			// 3日に1回程度の頻度でアクティビティを生成
			if (Math.random() > 0.3) continue;

			const date = new Date(now);
			date.setDate(date.getDate() - i);

			date.setHours(
				Math.floor(Math.random() * 24),
				Math.floor(Math.random() * 60),
			);

			const types = [ActivityType.Run, ActivityType.Ride, ActivityType.Walk];
			const type = types[Math.floor(Math.random() * types.length)];

			let distance = 0;
			let multiplier = 0;
			if (type === ActivityType.Run) {
				distance = Math.random() * 8 + 3;
				multiplier = 1.5;
			} else if (type === ActivityType.Ride) {
				distance = Math.random() * 30 + 10;
				multiplier = 0.5;
			} else {
				distance = Math.random() * 5 + 1;
				multiplier = 1.0;
			}

			const pointsAwarded = Math.floor(distance * multiplier);

			newActivities.push({
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
			for (const act of newActivities) {
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
			count: newActivities.length,
		});
	} catch (error) {
		console.error("Demo seed error:", error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
