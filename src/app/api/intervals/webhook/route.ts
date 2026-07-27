import { type NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { z } from "zod";
import { syncSingleIntervalsActivity } from "@/lib/intervals";

export const dynamic = "force-dynamic";

const IntervalsWebhookEventSchema = z.object({
	athlete_id: z.string(),
	type: z.string(),
	timestamp: z.string(),
	activity: z.object({
		id: z.union([z.number(), z.string()]),
		name: z.string().optional(),
		start_date_local: z.string().optional(),
		type: z.string().optional(),
	}).optional(),
});

const IntervalsWebhookPayloadSchema = z.object({
	secret: z.string(),
	events: z.array(IntervalsWebhookEventSchema),
});

export async function POST(request: NextRequest) {
	try {
		const rawData = await request.json();
		const parseResult = IntervalsWebhookPayloadSchema.safeParse(rawData);

		if (!parseResult.success) {
			console.error("Invalid Intervals.icu webhook payload:", parseResult.error);
			return new NextResponse("Bad Request", { status: 400 });
		}

		const { secret, events } = parseResult.data;

		// Verify the secret if configured
		const VERIFY_SECRET = process.env.INTERVALS_WEBHOOK_SECRET;
		if (VERIFY_SECRET && secret !== VERIFY_SECRET) {
			console.error("Intervals.icu webhook secret mismatch");
			return new NextResponse("Forbidden", { status: 403 });
		}

		console.log(`Intervals.icu webhook received with ${events.length} events`);

		for (const event of events) {
			const { athlete_id, type, activity } = event;

			// Handle activity created or updated
			if (
				(type === "ACTIVITY_UPLOADED" || type === "ACTIVITY_ANALYZED") &&
				activity?.id
			) {
				const activityIdStr = activity.id.toString();
				console.log(
					`[Intervals Webhook] Event ${type} detected: Activity ${activityIdStr} for athlete ${athlete_id}`,
				);

				// Perform sync in the background
				after(async () => {
					try {
						console.log(`[Intervals Webhook Background] Starting sync for athlete ${athlete_id}, activity ${activityIdStr}`);
						const result = await syncSingleIntervalsActivity(
							athlete_id,
							activityIdStr,
						);
						console.log(`[Intervals Webhook Background] Sync completed for ${activityIdStr}:`, result);
					} catch (err) {
						console.error(`[Intervals Webhook Background] Sync failed for ${activityIdStr}:`, err);
					}
				});
			}
		}

		return NextResponse.json({ status: "ok" });
	} catch (error) {
		console.error("Intervals webhook error:", error);
		return new NextResponse("Internal Error", { status: 500 });
	}
}
