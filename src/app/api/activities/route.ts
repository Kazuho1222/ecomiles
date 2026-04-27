import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
	const { userId } = await auth();
	if (!userId) {
		return new NextResponse("Unauthorized", { status: 401 });
	}

	const { searchParams } = new URL(request.url);
	const skip = Number.parseInt(searchParams.get("skip") || "0");
	const take = Number.parseInt(searchParams.get("take") || "20");

	try {
		const activities = await prisma.activity.findMany({
			where: { userId },
			orderBy: { activityDate: "desc" },
			skip,
			take,
		});

		return NextResponse.json(activities);
	} catch (error) {
		console.error("Failed to fetch activities:", error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
