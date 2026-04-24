import { SignInButton, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { IceCream, Leaf } from "lucide-react";
import { redirect } from "next/navigation";
import { CollectiveImpactDisplay } from "@/components/CollectiveImpact";
import { ConnectWithStrava, PoweredByStrava } from "@/components/StravaLogo";
import prisma from "@/lib/prisma";
import { getCollectiveImpact } from "@/lib/stats";

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

	const collectiveImpact = await getCollectiveImpact();

	return (
		<div className="flex min-h-screen flex-col items-center justify-between p-8 lg:p-24 bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100 transition-colors duration-500">
			<main className="flex flex-col items-center justify-center flex-1 w-full max-w-5xl">
				<div className="z-10 w-full items-center justify-between font-mono text-sm lg:flex mb-16">
					<h1 className="text-4xl font-black tracking-tighter text-emerald-600 dark:text-emerald-500">
						EcoMiles
					</h1>
					<div className="flex h-auto items-center justify-center lg:static lg:h-auto lg:w-auto mt-4 lg:mt-0">
						{userId ? (
							<UserButton />
						) : (
							<SignInButton mode="modal">
								<button className="px-6 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full font-bold shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer">
									ログイン
								</button>
							</SignInButton>
						)}
					</div>
				</div>

				<div className="text-center mb-16">
					<h2 className="text-5xl lg:text-7xl font-black mb-8 leading-tight tracking-tight">
						あなたの移動が
						<br />
						<span className="text-emerald-600 dark:text-emerald-500">
							地球の未来
						</span>
						を創る。
					</h2>
					<p className="text-xl mb-12 text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
						自転車・ウォーキング・ランニング。
						<br />
						環境に優しい移動をStravaで記録して、
						<br />
						目に見えるエコ貢献へ。
					</p>

					{userId ? (
						<div className="p-12 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 transition-all max-w-xl mx-auto">
							<h3 className="text-2xl font-bold mb-4">準備はいいですか？</h3>
							<p className="mb-8 text-slate-500 dark:text-slate-400">
								Strava と連携して、最初のアクティビティを同期しましょう。
							</p>
							<a
								href="/api/strava/auth"
								className="inline-block transition-transform hover:scale-105 active:scale-95 shadow-lg rounded-md overflow-hidden"
							>
								<ConnectWithStrava />
							</a>
						</div>
					) : (
						<div className="flex flex-col items-center">
							<div className="p-12 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 transition-all mb-16 max-w-xl mx-auto">
								<h3 className="text-2xl font-bold mb-4">今すぐ始めましょう</h3>
								<p className="mb-8 text-slate-500 dark:text-slate-400">
									Stravaアカウントを連携するだけで、
									<br />
									人力での移動が自動的にポイントとエコ指標に変わります。
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

							<CollectiveImpactDisplay data={collectiveImpact} />

							<div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
								<div className="p-10 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm text-left">
									<div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-6 text-emerald-600 dark:text-emerald-400">
										<Leaf size={28} />
									</div>
									<h4 className="text-2xl font-bold mb-4 italic">
										自動で貢献を可視化
									</h4>
									<p className="text-slate-500 dark:text-slate-400 leading-relaxed">
										Stravaで記録したアクティビティが自動的にEcoMilesに反映。CO2削減量を杉の木やスマホ充電回数など、身近な指標に変換します。
									</p>
								</div>
								<div className="p-10 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm text-left">
									<div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400">
										<IceCream size={28} />
									</div>
									<h4 className="text-2xl font-bold mb-4 italic">
										エコ・マイルストーン
									</h4>
									<p className="text-slate-500 dark:text-slate-400 leading-relaxed">
										活動を続けることでポイントを貯め、様々な「エコ称号」を獲得。あなたのフィットネスがそのまま地球環境の保護に直結します。
									</p>
								</div>
							</div>
						</div>
					)}
				</div>
			</main>

			<footer className="mt-24 flex flex-col items-center gap-6 py-12 border-t border-slate-100 dark:border-slate-800 w-full max-w-5xl mx-auto">
				<a
					href="https://strava.com"
					target="_blank"
					rel="noopener noreferrer"
					className="opacity-80 hover:opacity-100 transition-opacity"
				>
					<PoweredByStrava />
				</a>
				<p className="text-xs text-slate-400 font-mono">
					© 2026 EcoMiles. Dedicated to a sustainable future.
				</p>
			</footer>
		</div>
	);
}
