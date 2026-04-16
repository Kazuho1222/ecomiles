import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { syncActivities } from "@/lib/strava";

export async function POST() {
	const { userId } = await auth();

	if (!userId) {
		return new NextResponse("Unauthorized", { status: 401 });
	}

	try {
		const result = await syncActivities(userId);
		return NextResponse.json(result);
	} catch (error) {
		console.error("Sync error:", error);
		return new NextResponse("Internal Error", { status: 500 });
	}
}
