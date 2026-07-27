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
		return NextResponse.json(result);
	} catch (error) {
		console.error("Intervals sync error:", error);
		return new NextResponse("Internal Error", { status: 500 });
	}
}
