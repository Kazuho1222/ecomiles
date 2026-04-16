import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getStravaAuthUrl } from "@/lib/strava";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = getStravaAuthUrl();
  return NextResponse.redirect(url);
}
