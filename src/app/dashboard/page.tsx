import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import type { Activity, Point } from "@prisma/client";
import { redirect } from "next/navigation";
import { SyncButton } from "@/components/SyncButton";
import { Button } from "@/components/ui/button";
import prisma from "@/lib/prisma";
import {
	calculateCO2Reduction,
	calculateEarthLifespanExtension,
	calculateIceMeltingPrevention,
} from "@/lib/strava";
import { formatActivityDate } from "@/lib/utils";
import { Bike, Footprints, SportShoe } from "lucide-react";
import RealtimeDashboard from "@/components/RealtimeDashboard";

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
		<main className="flex min-h-screen flex-col items-center p-8 lg:p-24">
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
				<div className="p-6 bg-blue-50 rounded-xl border border-blue-200 shadow-sm flex items-center justify-between">
					<div>
						<h2 className="text-sm font-medium text-blue-800 uppercase tracking-wider mb-1">
							Strava 連携
						</h2>
						{user?.stravaConnected ? (
							<p className="text-xl font-semibold text-blue-900">連携済み (ID: {user.stravaAthleteId})</p>
						) : (
							<p className="text-xl font-semibold text-gray-500">未連携</p>
						)}
					</div>
					{!user?.stravaConnected && (
						<a href="/api/strava/auth">
							<Button size="sm">
								連携する
							</Button>
						</a>
					)}
				</div>

				{/* ユーザー情報 */}
				<div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
					<h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">
						ユーザー
					</h2>
					<p className="text-xl font-semibold text-gray-900">
						{user?.name || "ゲスト"} <span className="text-xs font-normal text-gray-500">({user?.email})</span>
					</p>
				</div>
			</div>

			{/* 最近のアクティビティ */}
			<div className="w-full max-w-5xl">
				<div className="flex items-center justify-between mb-6">
					<h2 className="text-2xl font-bold">最近のアクティビティ</h2>
					{user?.stravaConnected && <SyncButton />}
				</div>
				{recentActivities.length > 0 ? (
					<div className="overflow-x-auto border rounded-xl shadow-sm bg-white">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
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
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{recentActivities.map((activity: Activity) => (
									<tr key={activity.id}>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
											{formatActivityDate(activity.activityDate)}
										</td>
										<td className="flex px-6 py-4 gap-2 whitespace-nowrap text-sm text-gray-900">
											{activity.activityType === "Ride" ? <Bike /> : ""}
											{activity.activityType === "Walk" ? <Footprints /> : ""}
											{activity.activityType === "Run" ? <SportShoe /> : ""}
											{activity.activityType}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
											{activity.distance.toFixed(2)}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600 font-medium">
											{calculateCO2Reduction(activity.distance).toFixed(2)}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-bold">
											+{activity.pointsAwarded}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				) : (
					<div className="p-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
						<p className="text-gray-500">アクティビティはまだありません。</p>
						<p className="text-sm text-gray-400 mt-1">
							Strava で最初のアクティビティを記録してみましょう！
						</p>
					</div>
				)}
			</div>
		</main>
	);
}
