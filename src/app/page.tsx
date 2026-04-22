import { SignInButton, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ConnectWithStrava, PoweredByStrava } from "@/components/StravaLogo";
import prisma from "@/lib/prisma";

export default async function Home() {
	const { userId } = await auth();

	if (userId) {
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: { stravaConnected: true },
		});

		if (user?.stravaConnected) {
			redirect("/dashboard");
		}
	}

	return (
		<div className="flex min-h-screen flex-col items-center justify-between p-8 lg:p-24">
			<main className="flex flex-col items-center justify-center flex-1 w-full max-w-5xl">
				<div className="z-10 w-full items-center justify-between font-mono text-sm lg:flex mb-12">
					<h1 className="text-4xl font-bold">EcoMiles</h1>
					<div className="flex h-auto items-center justify-center lg:static lg:h-auto lg:w-auto">
						{userId ? (
							<UserButton />
						) : (
							<SignInButton mode="modal">
								<button
									type="button"
									className="px-4 py-2 border rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
								>
									ログイン
								</button>
							</SignInButton>
						)}
					</div>
				</div>

				<div className="text-center">
					<p className="text-xl mb-8 text-gray-600 dark:text-gray-400">
						環境に優しい移動（自転車・ウォーキング・ランニング）で地球に貢献し、ポイントを貯めよう。
					</p>

					{userId ? (
						<div className="p-10 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 transition-all hover:shadow-2xl">
							<h2 className="text-2xl font-semibold mb-4">
								準備はいいですか？
							</h2>
							<p className="mb-8 text-gray-500">
								Strava
								と連携して、あなたのアクティビティをエコ貢献に変えましょう。
							</p>
							<a
								href="/api/strava/auth"
								className="inline-block transition-transform hover:scale-105 active:scale-95 shadow-lg rounded-md overflow-hidden"
							>
								<ConnectWithStrava />
							</a>
						</div>
					) : (
						<div className="flex flex-col items-center gap-8">
							<div className="p-10 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 transition-all hover:shadow-2xl mb-8">
								<h2 className="text-2xl font-semibold mb-4">
									今すぐ始めましょう
								</h2>
								<p className="mb-8 text-gray-500">
									Strava
									アカウントを連携するだけで、移動距離がポイントに変わります。
								</p>
								<SignInButton mode="modal" forceRedirectUrl="/api/strava/auth">
									<button
										type="button"
										className="inline-block cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-md hover:shadow-xl rounded-md border-none p-0 m-0 bg-transparent"
									>
										<ConnectWithStrava />
									</button>
								</SignInButton>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
								<div className="p-8 border rounded-2xl bg-slate-50 dark:bg-slate-900/50">
									<h3 className="text-xl font-bold mb-3">自動でポイント獲得</h3>
									<p className="text-gray-500">
										Strava
										アカウントを連携するだけで、日々の移動が自動的にポイントに変わります。
									</p>
								</div>
								<div className="p-8 border rounded-2xl bg-slate-50 dark:bg-slate-900/50">
									<h3 className="text-xl font-bold mb-3">
										環境への貢献を可視化
									</h3>
									<p className="text-gray-500">
										CO2削減量や守った氷の量など、あなたの活動が地球に与えるインパクトを実感できます。
									</p>
								</div>
							</div>
						</div>
					)}
				</div>
			</main>

			<footer className="mt-16 flex flex-col items-center gap-4">
				<a
					href="https://strava.com"
					target="_blank"
					rel="noopener noreferrer"
					className="opacity-80 hover:opacity-100 transition-opacity"
				>
					<PoweredByStrava />
				</a>
				<p className="text-xs text-gray-400">
					© 2026 EcoMiles. All rights reserved.
				</p>
			</footer>
		</div>
	);
}
