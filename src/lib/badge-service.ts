import prisma from "./prisma";
import { BADGE_DEFINITIONS } from "./badges";
import { calculateCO2Reduction } from "./eco-utils";

/**
 * ユーザーの統計情報を確認し、新しいバッジを獲得しているかチェックする
 */
export const checkAndAwardBadges = async (userId: string) => {
	// 1. ユーザーの統計情報を取得
	const user = await prisma.user.findUnique({
		where: { id: userId },
		include: {
			activities: true,
			points: true,
			badges: {
				include: {
					badge: true,
				},
			},
		},
	});

	if (!user) return [];

	const totalDistance = user.activities.reduce((sum, a) => sum + a.distance, 0);
	const totalCO2Saved = calculateCO2Reduction(totalDistance);
	const totalPoints = user.points.reduce((sum, p) => sum + p.points, 0);
	const totalActivities = user.activities.length;

	// 獲得済みのバッジ名リスト
	const awardedBadgeNames = user.badges.map((ub) => ub.badge.name);

	const newlyAwardedBadges = [];

	// 2. 各バッジの条件をチェック
	for (const definition of BADGE_DEFINITIONS) {
		// 既に獲得済みならスキップ
		if (awardedBadgeNames.includes(definition.name)) continue;

		let achieved = false;
		switch (definition.type) {
			case "DISTANCE":
				achieved = totalDistance >= definition.threshold;
				break;
			case "CO2_SAVED":
				achieved = totalCO2Saved >= definition.threshold;
				break;
			case "POINTS":
				achieved = totalPoints >= definition.threshold;
				break;
			case "ACTIVITY_COUNT":
				achieved = totalActivities >= definition.threshold;
				break;
		}

		if (achieved) {
			// 3. バッジをDBに登録（マスターがなければ作成）+ 付与を冪等に
			try {
				await prisma.$transaction(async (tx) => {
					const badge = await tx.badge.upsert({
						where: { name: definition.name },
						update: {},
						create: {
							name: definition.name,
							description: definition.description,
							type: definition.type,
							threshold: definition.threshold,
						},
					});
					await tx.userBadge.upsert({
						where: {
							userId_badgeId: { userId: user.id, badgeId: badge.id },
						},
						update: {},
						create: { userId: user.id, badgeId: badge.id },
					});
				});
				newlyAwardedBadges.push(definition);
			} catch (err) {
				// 並行実行時の一意制約違反は無視
				console.error("Failed to award badge", definition.name, err);
			}
		}
	}

	return newlyAwardedBadges;
};
