import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { SyncButton } from "@/components/SyncButton";

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
				take: 5,
			},
			points: true,
		},
	});

	const totalPoints = user?.points.reduce((sum, p) => sum + p.points, 0) || 0;

	return (
		<main className="flex min-h-screen flex-col items-center p-8 lg:p-24">
			<div className="z-10 max-w-5xl w-full flex items-center justify-between font-mono text-sm mb-12">
				<h1 className="text-3xl font-bold">EcoMiles Dashboard</h1>
				<div className="flex items-center gap-4">
					<UserButton />
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
				{/* ポイント概要 */}
				<div className="p-6 bg-green-50 rounded-xl border border-green-200 shadow-sm">
					<h2 className="text-sm font-medium text-green-800 uppercase tracking-wider mb-2">
						現在のポイント
					</h2>
					<p className="text-4xl font-bold text-green-900">{totalPoints} pts</p>
				</div>

				{/* Strava 連携状況 */}
				<div className="p-6 bg-blue-50 rounded-xl border border-blue-200 shadow-sm">
					<h2 className="text-sm font-medium text-blue-800 uppercase tracking-wider mb-2">
						Strava 連携
					</h2>
					{user?.stravaConnected ? (
						<div>
							<p className="text-xl font-semibold text-blue-900">連携済み</p>
							<p className="text-xs text-blue-700 mt-1">
								ID: {user.stravaAthleteId}
							</p>
						</div>
					) : (
						<div>
							<p className="text-xl font-semibold text-gray-500">未連携</p>
							<a href="/api/strava/auth">
								<Button size="sm" className="mt-2">
									連携する
								</Button>
							</a>
						</div>
					)}
				</div>

				{/* ユーザー情報 */}
				<div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
					<h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
						ユーザー名
					</h2>
					<p className="text-xl font-semibold text-gray-900">
						{user?.name || "ゲストユーザー"}
					</p>
					<p className="text-xs text-gray-500">{user?.email}</p>
				</div>
			</div>

			{/* 最近のアクティビティ */}
			<div className="mt-12 w-full max-w-5xl">
				<div className="flex items-center justify-between mb-6">
					<h2 className="text-2xl font-bold">最近のアクティビティ</h2>
					{user?.stravaConnected && <SyncButton />}
				</div>
				{user?.activities && user.activities.length > 0 ? (
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
										獲得ポイント
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{user.activities.map((activity) => (
									<tr key={activity.id}>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
											{new Date(activity.activityDate).toLocaleDateString()}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
											{activity.activityType}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
											{activity.distance.toFixed(2)}
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
