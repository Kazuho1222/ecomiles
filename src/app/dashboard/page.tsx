import { UserButton } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import type { Activity, Point } from "@prisma/client";
import { redirect } from "next/navigation";
import { ActivityCalendar } from "@/components/ActivityCalendar";
import { BadgeList } from "@/components/BadgeList";
import { CollectiveImpactCard } from "@/components/CollectiveImpact";
import { DashboardDrilldown } from "@/components/DashboardDrilldown";
import { Leaderboard } from "@/components/Leaderboard";
import { ShareModal } from "@/components/ShareModal";
import { PoweredByStrava, StravaSymbol } from "@/components/StravaLogo";
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
import {
	getActivityCalendarStats,
	getCollectiveImpact,
	getLeaderboard,
} from "@/lib/stats";

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
				take: 20,
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
	const collectiveImpact = await getCollectiveImpact();
	const calendarStats = await getActivityCalendarStats(userId);

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
		userName: user?.name || clerkUser?.firstName || clerkUser?.username || "Athlete",
		avatarUrl: clerkUser?.imageUrl,
	};

	const isDemoMode = user?.activities.some((a) =>
		a.stravaActivityId.startsWith("demo-"),
	);

	return (
		<main className="flex min-h-screen flex-col items-center p-6 lg:p-12 bg-slate-50 dark:bg-black">
			{isDemoMode && (
				<div className="w-full max-w-5xl mb-8 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-2xl p-4 flex items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-xl text-amber-600 dark:text-amber-400">
							<span className="text-lg">💡</span>
						</div>
						<div>
							<p className="text-sm font-black text-amber-900 dark:text-amber-200 tracking-tight">
								現在はデモモードで表示しています
							</p>
							<p className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
								実際のアクティビティを同期するには Strava と連携してください。
							</p>
						</div>
					</div>
					<a
						href="/api/strava/auth"
						className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black rounded-xl transition-all shadow-sm"
					>
						Stravaと連携
					</a>
				</div>
			)}

			<div className="z-10 max-w-5xl w-full flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
				<div className="flex flex-col items-center md:items-start">
					<h1 className="text-4xl font-black text-emerald-600 dark:text-emerald-500 tracking-tighter">
						EcoMiles
					</h1>
					<p className="text-slate-400 font-bold text-xs tracking-[0.3em] mt-1">
						アスリート・ダッシュボード
					</p>
				</div>

				<div className="flex items-center gap-6 bg-white dark:bg-slate-900 p-2 pl-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
					<div className="flex flex-col items-end">
						<p className="text-[10px] font-black text-slate-400 tracking-widest">
							おかえりなさい
						</p>
						<p className="text-sm font-black text-slate-900 dark:text-slate-100">
							{user?.name || clerkUser?.firstName || clerkUser?.username || "アスリート"}
						</p>
					</div>
					<div className="h-8 w-px bg-slate-100 dark:bg-slate-800" />
					<div className="flex items-center gap-3">
						<ShareModal data={shareData} variant="compact" />
						{user?.stravaConnected && (
							<div className="flex items-center gap-2 px-3 py-1 bg-orange-50 dark:bg-orange-950/30 rounded-full border border-orange-100 dark:border-orange-900">
								<StravaSymbol color="#FC5200" size={14} />
								<span className="text-[10px] font-black text-orange-600 dark:text-orange-400 tracking-wider">
									Strava連携済み
								</span>
							</div>
						)}
						<UserButton
							appearance={{
								elements: {
									userButtonAvatarBox: "w-10 h-10 border-2 border-emerald-500",
								},
							}}
						/>
					</div>
				</div>
			</div>

			{/* メインコンテンツ: 履歴・統計 & サイドバー */}
			<DashboardDrilldown
				dashboardData={dashboardData}
				activities={user?.activities || []}
				stravaConnected={!!user?.stravaConnected}
				key={user?.id}
				sidebarTop={<BadgeList key="badges" userBadges={user?.badges || []} />}
				wideContent={
					<div className="space-y-12">
						<ActivityCalendar key="calendar" stats={calendarStats} />
						<CollectiveImpactCard
							key="impact"
							data={collectiveImpact}
							userCO2Reduction={totalCO2Reduction}
						/>
					</div>
				}
				sidebarBottom={
					<Leaderboard key="leaderboard" entries={leaderboardEntries} />
				}
			/>

			<footer className="mt-auto flex flex-col items-center gap-4 py-16 w-full max-w-5xl">
				<a
					href="https://strava.com"
					target="_blank"
					rel="noopener noreferrer"
					className="opacity-40 hover:opacity-100 transition-opacity"
				>
					<PoweredByStrava />
				</a>
			</footer>
		</main>
	);
}
