import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getIntervalsAuthUrl } from "@/lib/intervals";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = getIntervalsAuthUrl();
  return NextResponse.redirect(url);
}
