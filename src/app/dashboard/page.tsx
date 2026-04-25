import { UserButton } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import type { Activity, Point } from "@prisma/client";
import { redirect } from "next/navigation";
import { BadgeList } from "@/components/BadgeList";
import { DashboardDrilldown } from "@/components/DashboardDrilldown";
import { Leaderboard } from "@/components/Leaderboard";
import { ShareModal } from "@/components/ShareModal";
import { ConnectWithStrava, PoweredByStrava } from "@/components/StravaLogo";
import { checkAndAwardBadges } from "@/lib/badge-service";
import {
	calculateCedarTreeEquivalent,
	calculateCO2Reduction,
	calculateEarthLifespanExtension,
	calculateIceMeltingPrevention,
	calculateLEDBulbHours,
	calculateSmartphoneCharges,
} from "@/lib/eco-utils";
import prisma from "@/lib/prisma";
import { getLeaderboard } from "@/lib/stats";

export default async function DashboardPage() {
	const { userId } = await auth();
	const clerkUser = await currentUser();

	if (!userId) {
		redirect("/");
	}

	// ページ表示時にバッジ獲得をチェック
	try {
		await checkAndAwardBadges(userId);
	} catch (error) {
		console.error("Failed to check badges:", error);
	}

	const user = await prisma.user.findUnique({
		where: { id: userId },
		include: {
			activities: {
				orderBy: { activityDate: "desc" },
			},
			points: {
				orderBy: { createdAt: "desc" },
			},
			badges: {
				include: {
					badge: true,
				},
				orderBy: { awardedAt: "desc" },
			},
		},
	});

	const leaderboardEntries = await getLeaderboard(5);

	const totalPoints =
		user?.points.reduce((sum: number, p: Point) => sum + p.points, 0) || 0;

	const totalDistance =
		user?.activities.reduce(
			(sum: number, a: Activity) => sum + a.distance,
			0,
		) || 0;

	const totalCO2Reduction = calculateCO2Reduction(totalDistance);
	const lifespanExtension = calculateEarthLifespanExtension(totalCO2Reduction);
	const iceSaved = calculateIceMeltingPrevention(totalCO2Reduction);
	const cedarTrees = calculateCedarTreeEquivalent(totalCO2Reduction);
	const smartphoneCharges = calculateSmartphoneCharges(totalCO2Reduction);
	const ledBulbHours = calculateLEDBulbHours(totalCO2Reduction);

	const dashboardData = {
		totalPoints,
		totalCO2Reduction,
		lifespanExtension,
		iceSaved,
		cedarTrees,
		smartphoneCharges,
		ledBulbHours,
	};

	const shareData = {
		totalPoints,
		totalCO2Reduction,
		iceSaved,
		cedarTrees,
		userName: user?.name || "Athlete",
		avatarUrl: clerkUser?.imageUrl,
	};

	return (
		<main className="flex min-h-screen flex-col items-center p-8 lg:p-24 bg-slate-50 dark:bg-black">
			<div className="z-10 max-w-5xl w-full flex items-center justify-between font-mono text-sm mb-12">
				<h1 className="text-3xl font-black text-emerald-600 dark:text-emerald-500">
					EcoMiles Dashboard
				</h1>
				<div className="flex items-center gap-4">
					<div className="w-full max-w-5xl flex justify-center">
						<ShareModal data={shareData} />
					</div>
					<UserButton />
				</div>
			</div>

			{/* インタラクティブな数値カード & ドリルダウン履歴 */}
			<DashboardDrilldown
				dashboardData={dashboardData}
				activities={user?.activities || []}
				points={user?.points || []}
				stravaConnected={!!user?.stravaConnected}
			/>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-5xl mb-12">
				<div className="lg:col-span-2 space-y-8">
					{/* Strava 連携状況 */}
					<div className="p-8 bg-orange-50 dark:bg-orange-950/20 rounded-3xl border border-orange-200 dark:border-orange-900 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
						<div>
							<h2 className="text-sm font-bold text-orange-800 dark:text-orange-400 uppercase tracking-widest mb-2">
								Strava 連携状況
							</h2>
							{user?.stravaConnected ? (
								<p className="text-2xl font-black text-orange-900 dark:text-orange-200">
									連携済み
								</p>
							) : (
								<p className="text-2xl font-black text-gray-400">未連携</p>
							)}
						</div>
						{!user?.stravaConnected && (
							<a
								href="/api/strava/auth"
								className="transition-transform hover:scale-105 active:scale-95 shadow-lg rounded-md overflow-hidden"
							>
								<ConnectWithStrava />
							</a>
						)}
						{user?.stravaConnected && (
							<div className="flex flex-col items-end">
								<span className="text-xs text-orange-600 dark:text-orange-400 font-mono font-bold mb-2">
									Athlete ID: {user.stravaAthleteId}
								</span>
								<div className="bg-orange-500 h-3 w-3 rounded-full animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
							</div>
						)}
					</div>
				</div>

				<div className="space-y-8">
					{/* 獲得したバッジ */}
					<BadgeList userBadges={user?.badges || []} />

					{/* リーダーボード */}
					<Leaderboard entries={leaderboardEntries} />

					{/* ユーザー情報 */}
					<div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
						<h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
							プロフィール
						</h2>
						<p className="text-xl font-black text-slate-900 dark:text-slate-100">
							{user?.name || "ゲスト"}
						</p>
						<p className="text-xs text-slate-500 font-mono mt-1">
							{user?.email}
						</p>
					</div>
				</div>
			</div>

			<footer className="mt-auto flex flex-col items-center gap-4 py-12 border-t border-slate-100 dark:border-slate-800 w-full max-w-5xl">
				<a
					href="https://strava.com"
					target="_blank"
					rel="noopener noreferrer"
					className="opacity-80 hover:opacity-100 transition-opacity"
				>
					<PoweredByStrava />
				</a>
			</footer>
		</main>
	);
}
