import { SignInButton, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
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
		<main className="flex min-h-screen flex-col items-center justify-center p-24">
			<div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
				<h1 className="text-4xl font-bold">EcoMiles</h1>
				<div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-linear-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
					{userId ? (
						<UserButton />
					) : (
						<SignInButton mode="modal">
							<Button>ログイン</Button>
						</SignInButton>
					)}
				</div>
			</div>

			<div className="mt-12 text-center">
				<p className="text-xl mb-4">
					環境に優しい移動（自転車・ウォーキング・ランニング）でポイントを貯めよう。
				</p>
				{userId ? (
					<div className="p-6 bg-slate-100 rounded-lg">
						<h2 className="text-2xl font-semibold mb-2">おかえりなさい！</h2>
						<p>Strava と連携して、最初のアクティビティを記録しましょう。</p>
						<a href="/api/strava/auth">
							<Button className="mt-4" variant="default">
								Strava と連携する
							</Button>
						</a>
					</div>
				) : (
					<div className="p-6 border rounded-lg">
						<h2 className="text-2xl font-semibold mb-2">今すぐ始めましょう</h2>
						<p>
							Strava
							アカウントを連携するだけで、移動距離がポイントに変わります。
						</p>
					</div>
				)}
			</div>
		</main>
	);
}
