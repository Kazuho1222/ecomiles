import { type NextRequest, NextResponse } from "next/server";
import { syncSingleActivity } from "@/lib/strava";

export const dynamic = "force-dynamic";

/**
 * Strava Webhook Endpoint
 *
 * GET: サブスクリプションの検証用
 * POST: イベント通知用
 */

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const mode = searchParams.get("hub.mode");
	const token = searchParams.get("hub.verify_token");
	const challenge = searchParams.get("hub.challenge");

	const VERIFY_TOKEN = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN;

	console.log("Webhook Verification Attempt:", {
		mode,
		token,
		challenge,
		tokenMatch: token === VERIFY_TOKEN,
	});

	if (mode === "subscribe" && token === VERIFY_TOKEN) {
		console.log("Webhook verified successfully");
		return NextResponse.json({ "hub.challenge": challenge });
	}

	console.error(
		"Webhook verification failed: token mismatch or incorrect mode",
	);
	return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(request: NextRequest) {
	try {
		const data = await request.json();
		console.log("Strava webhook event received:", data);

		const { aspect_type, object_id, object_type, owner_id } = data;

		// アクティビティが作成または更新された場合に処理
		if (
			object_type === "activity" &&
			(aspect_type === "create" || aspect_type === "update")
		) {
			console.log(
				`${aspect_type === "create" ? "New" : "Updated"} activity detected: ${object_id} for user ${owner_id}`,
			);

			// 非同期で同期処理を実行（レスポンスを待たずに処理）
			syncSingleActivity(owner_id.toString(), object_id.toString())
				.then((result) => console.log("Sync result:", result))
				.catch((err) => console.error("Sync error:", err));
		}

		return NextResponse.json({ status: "ok" });
	} catch (error) {
		console.error("Webhook error:", error);
		return new NextResponse("Internal Error", { status: 500 });
	}
}
