import { NextResponse } from "next/server";

export async function POST() {
	// 実際には同期せず、フロントエンドの通知演出をテストするためのモックデータを返します
	return NextResponse.json({
		success: true,
		newActivitiesCount: 1,
		pointsAwardedTotal: 15,
		co2ReductionDelta: 2.5,
		newBadges: [
			{
				name: "テスト・エコアスリート",
				description: "演出テスト用の架空のバッジを獲得しました！",
			},
		],
	});
}
