import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { syncIntervalsActivities } from "@/lib/intervals";

export async function POST(): Promise<NextResponse> {
	const { userId } = await auth();

	if (!userId) {
		return new NextResponse("Unauthorized", { status: 401 });
	}

	try {
		const result = await syncIntervalsActivities(userId);
		if (!result.success) {
			// クライアント起因エラーと上流サービスの一時的通信障害を明確に分離
			let status = 400;
			if (result.errorType === "TOKEN_EXPIRED") {
				status = 401; // 再認可が必要
			} else if (result.errorType === "NOT_CONNECTED") {
				status = 400; // 未連携
			} else if (result.errorType === "UPSTREAM_ERROR") {
				status = 502; // Intervals.icu 上流サービスとの通信エラー（再試行可能）
			}

			return NextResponse.json(result, { status });
		}
		return NextResponse.json(result);
	} catch (error) {
		console.error("Intervals sync unexpected error:", error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
