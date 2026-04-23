import { UserButton } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import type { Activity, Point } from "@prisma/client";
import { Bike, Footprints, SportShoe } from "lucide-react";
import { redirect } from "next/navigation";
import { Leaderboard } from "@/components/Leaderboard";
import RealtimeDashboard from "@/components/RealtimeDashboard";
import { ShareModal } from "@/components/ShareModal";
import { ConnectWithStrava, PoweredByStrava } from "@/components/StravaLogo";
import { SyncButton } from "@/components/SyncButton";
import prisma from "@/lib/prisma";
import { getLeaderboard } from "@/lib/stats";
import {
	calculateCedarTreeEquivalent,
	calculateCO2Reduction,
	calculateEarthLifespanExtension,
	calculateIceMeltingPrevention,
	calculateLEDBulbHours,
	calculateSmartphoneCharges,
} from "@/lib/strava";
import { formatActivityDate } from "@/lib/utils";

export default async function DashboardPage() {
	const { userId } = await auth();
	const clerkUser = await currentUser();

	if (!userId) {
		redirect("/");
	}

	const user = await prisma.user.findUnique({
		where: { id: userId },
		include: {
			activities: {
				orderBy: { activityDate: "desc" },
			},
			points: true,
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

	const recentActivities = user?.activities.slice(0, 5) || [];

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

			{/* インタラクティブな数値カード */}
			<RealtimeDashboard initialData={dashboardData} />

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

					{/* 最近のアクティビティ */}
					<div className="w-full">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-2xl font-black">最近のアクティビティ</h2>
							{user?.stravaConnected && <SyncButton />}
						</div>
						{recentActivities.length > 0 ? (
							<div className="overflow-x-auto border rounded-2xl shadow-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 transition-all">
								<table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800">
									<thead className="bg-slate-50 dark:bg-slate-800/50">
										<tr>
											<th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">
												日付
											</th>
											<th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">
												タイプ
											</th>
											<th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">
												距離
											</th>
											<th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">
												削減量
											</th>
											<th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest truncate">
												ポイント
											</th>
											<th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-widest">
												詳細
											</th>
										</tr>
									</thead>
									<tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-800">
										{recentActivities.map((activity: Activity) => (
											<tr
												key={activity.id}
												className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
											>
												<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
													{formatActivityDate(activity.activityDate)}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm">
													<div className="flex items-center gap-2">
														{activity.activityType === "Ride" ? (
															<Bike className="w-4 h-4 text-orange-500" />
														) : (
															""
														)}
														{activity.activityType === "Walk" ? (
															<Footprints className="w-4 h-4 text-emerald-500" />
														) : (
															""
														)}
														{activity.activityType === "Run" ? (
															<SportShoe className="w-4 h-4 text-blue-500" />
														) : (
															""
														)}
														<span className="font-bold">
															{activity.activityType}
														</span>
													</div>
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
													{activity.distance.toFixed(2)}{" "}
													<small className="text-slate-400 font-normal">
														km
													</small>
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600 dark:text-emerald-400 font-black">
													{calculateCO2Reduction(activity.distance).toFixed(2)}{" "}
													<small className="font-normal opacity-70">kg</small>
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400 font-black">
													+{activity.pointsAwarded}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-right">
													<a
														href={`https://www.strava.com/activities/${activity.stravaActivityId}`}
														target="_blank"
														rel="noopener noreferrer"
														className="text-[#FC5200] hover:underline font-black text-xs uppercase"
													>
														View on Strava
													</a>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						) : (
							<div className="p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
								<p className="text-slate-500">
									アクティビティはまだありません。
								</p>
								<p className="text-sm text-slate-400 mt-2">
									Strava で最初のアクティビティを記録してみましょう！
								</p>
							</div>
						)}
					</div>
				</div>

				<div className="space-y-8">
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
