import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import type { Activity, Point } from "@prisma/client";
import { Bike, Footprints, SportShoe } from "lucide-react";
import { redirect } from "next/navigation";
import RealtimeDashboard from "@/components/RealtimeDashboard";
import { ConnectWithStrava, PoweredByStrava } from "@/components/StravaLogo";
import { SyncButton } from "@/components/SyncButton";
import prisma from "@/lib/prisma";
import {
	calculateCO2Reduction,
	calculateEarthLifespanExtension,
	calculateIceMeltingPrevention,
} from "@/lib/strava";
import { formatActivityDate } from "@/lib/utils";

export default async function DashboardPage() {
	const { userId } = await auth();

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

	const recentActivities = user?.activities.slice(0, 5) || [];

	const dashboardData = {
		totalPoints,
		totalCO2Reduction,
		lifespanExtension,
		iceSaved,
	};

	return (
		<main className="flex min-h-screen flex-col items-center p-8 lg:p-24 bg-slate-50 dark:bg-black">
			<div className="z-10 max-w-5xl w-full flex items-center justify-between font-mono text-sm mb-12">
				<h1 className="text-3xl font-bold">EcoMiles Dashboard</h1>
				<div className="flex items-center gap-4">
					<UserButton />
				</div>
			</div>

			{/* インタラクティブな数値カード */}
			<RealtimeDashboard initialData={dashboardData} />

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl mb-12">
				{/* Strava 連携状況 */}
				<div className="p-6 bg-orange-50 dark:bg-orange-950/20 rounded-xl border border-orange-200 dark:border-orange-900 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
					<div>
						<h2 className="text-sm font-medium text-orange-800 dark:text-orange-400 uppercase tracking-wider mb-1">
							Strava 連携状況
						</h2>
						{user?.stravaConnected ? (
							<p className="text-xl font-semibold text-orange-900 dark:text-orange-200">
								連携済み
							</p>
						) : (
							<p className="text-xl font-semibold text-gray-500">未連携</p>
						)}
					</div>
					{!user?.stravaConnected && (
						<a
							href="/api/strava/auth"
							className="transition-transform hover:scale-105 active:scale-95"
						>
							<ConnectWithStrava />
						</a>
					)}
					{user?.stravaConnected && (
						<div className="flex flex-col items-end">
							<span className="text-xs text-orange-600 dark:text-orange-400 font-mono mb-1">
								ID: {user.stravaAthleteId}
							</span>
							<div className="bg-orange-500 h-2 w-2 rounded-full animate-pulse" />
						</div>
					)}
				</div>

				{/* ユーザー情報 */}
				<div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
					<h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">
						ユーザー
					</h2>
					<p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
						{user?.name || "ゲスト"}{" "}
						<span className="text-xs font-normal text-gray-500">
							({user?.email})
						</span>
					</p>
				</div>
			</div>

			{/* 最近のアクティビティ */}
			<div className="w-full max-w-5xl mb-16">
				<div className="flex items-center justify-between mb-6">
					<h2 className="text-2xl font-bold">最近のアクティビティ</h2>
					{user?.stravaConnected && <SyncButton />}
				</div>
				{recentActivities.length > 0 ? (
					<div className="overflow-x-auto border rounded-xl shadow-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 transition-all hover:shadow-lg">
						<table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800">
							<thead className="bg-gray-50 dark:bg-slate-800/50">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
										日付
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
										タイプ
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
										距離 (km)
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
										CO2削減量 (kg)
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
										獲得ポイント
									</th>
									<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 tracking-wider">
										詳細
									</th>
								</tr>
							</thead>
							<tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-800">
								{recentActivities.map((activity: Activity) => (
									<tr
										key={activity.id}
										className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors"
									>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
											{formatActivityDate(activity.activityDate)}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
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
												{activity.activityType}
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
											{activity.distance.toFixed(2)}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600 font-medium">
											{calculateCO2Reduction(activity.distance).toFixed(2)}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-bold">
											+{activity.pointsAwarded}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-right">
											<a
												href={`https://www.strava.com/activities/${activity.stravaActivityId}`}
												target="_blank"
												rel="noopener noreferrer"
												className="text-[#FC5200] hover:underline font-bold"
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
					<div className="p-12 text-center bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-gray-300 dark:border-slate-700">
						<p className="text-gray-500">アクティビティはまだありません。</p>
						<p className="text-sm text-gray-400 mt-1">
							Strava で最初のアクティビティを記録してみましょう！
						</p>
					</div>
				)}
			</div>

			<footer className="mt-auto flex flex-col items-center gap-4 py-8">
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
