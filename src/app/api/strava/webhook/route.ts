import { type NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { z } from "zod";
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

const StravaWebhookSchema = z.object({
	aspect_type: z.enum(["create", "update", "delete"]),
	event_time: z.number(),
	object_id: z.number(),
	object_type: z.enum(["activity", "athlete"]),
	owner_id: z.number(),
	subscription_id: z.number(),
	updates: z.record(z.string(), z.any()).optional(),
});

type StravaWebhookData = z.infer<typeof StravaWebhookSchema>;

export async function POST(request: NextRequest) {
	try {
		const rawData = await request.json();
		const parseResult = StravaWebhookSchema.safeParse(rawData);

		if (!parseResult.success) {
			console.error("Invalid Strava webhook payload:", parseResult.error);
			return new NextResponse("Bad Request", { status: 400 });
		}

		const data = parseResult.data;
		console.log("Strava webhook event received:", data);

		const { aspect_type, object_id, object_type, owner_id } = data;

		// アクティビティが作成または更新された場合に処理
		if (
			object_type === "activity" &&
			(aspect_type === "create" || aspect_type === "update")
		) {
			console.log(
				`[Webhook] ${aspect_type === "create" ? "New" : "Updated"} activity detected: ${object_id} for user ${owner_id}`,
			);

			// Stravaの2秒タイムアウトを回避するため、先にレスポンスを返し、
			// Next.jsの after() を使用してバックグラウンドで同期処理を行う
			after(async () => {
				try {
					console.log(`[Webhook Background] Starting sync for ${object_id}`);
					const result = await syncSingleActivity(
						owner_id.toString(),
						object_id.toString(),
					);
					console.log(`[Webhook Background] Sync completed for ${object_id}:`, result);
				} catch (err) {
					console.error(`[Webhook Background] Sync failed for ${object_id}:`, err);
				}
			});
		}

		return NextResponse.json({ status: "ok" });
	} catch (error) {
		console.error("Webhook error:", error);
		return new NextResponse("Internal Error", { status: 500 });
	}
}
