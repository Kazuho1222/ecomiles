import {
	calculateCedarTreeEquivalent,
	calculateCO2Reduction,
	calculateEarthLifespanExtension,
	calculateIceMeltingPrevention,
} from "@/lib/eco-utils";
import prisma from "./prisma";

export const getCollectiveImpact = async () => {
	const stats = await prisma.activity.aggregate({
		_sum: {
			distance: true,
		},
		_count: {
			id: true,
		},
	});

	const totalDistance = stats._sum.distance || 0;
	const totalActivities = stats._count.id || 0;
	const totalCO2Reduction = calculateCO2Reduction(totalDistance);

	return {
		totalDistance,
		totalActivities,
		totalCO2Reduction,
		lifespanExtension: calculateEarthLifespanExtension(totalCO2Reduction),
		iceSaved: calculateIceMeltingPrevention(totalCO2Reduction),
		cedarTrees: calculateCedarTreeEquivalent(totalCO2Reduction),
	};
};

export const getLeaderboard = async (limit = 5) => {
	// 1. ポイントテーブルでユーザーごとに合計ポイントを集計し、降順でソートして制限件数分取得
	const pointAggregates = await prisma.point.groupBy({
		by: ["userId"],
		_sum: {
			points: true,
		},
		orderBy: {
			_sum: {
				points: "desc",
			},
		},
		take: limit,
	});

	if (pointAggregates.length === 0) return [];

	// 2. ランクインしたユーザーの情報を取得
	const userIds = pointAggregates.map((item) => item.userId);
	const users = await prisma.user.findMany({
		where: {
			id: { in: userIds },
		},
		select: {
			id: true,
			name: true,
		},
	});

	// 3. 集計結果とユーザー情報をマッピングし、元の順序（ポイント順）を維持
	const leaderboard = pointAggregates
		.map((item) => {
			const user = users.find((u) => u.id === item.userId);
			return {
				id: item.userId,
				name: user?.name || "Anonymous Athlete",
				totalPoints: item._sum.points || 0,
			};
		})
		.filter((item) => item.totalPoints > 0);

	return leaderboard;
};
