import { clerkClient } from "@clerk/nextjs/server";
import { createClerkClient } from "@clerk/backend";

export interface IntervalsTokenData {
	access_token: string;
	refresh_token?: string;
}

async function getClerkBackendClient() {
	if (process.env.CLERK_SECRET_KEY) {
		return createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
	}
	return await clerkClient();
}

/**
 * Intervals.icu のトークンを Clerk の privateMetadata に安全に保存する
 * 自前DBには一切保存せず、Clerkのセキュアなバックエンドメタデータとして保持する
 */
export async function saveIntervalsTokensToClerk(
	userId: string,
	data: IntervalsTokenData,
): Promise<void> {
	const client = await getClerkBackendClient();
	await client.users.updateUserMetadata(userId, {
		privateMetadata: {
			intervalsAccessToken: data.access_token,
			...(data.refresh_token ? { intervalsRefreshToken: data.refresh_token } : {}),
		},
	});
}

/**
 * Clerk の privateMetadata から Intervals.icu のトークンを取得する
 */
export async function getIntervalsTokensFromClerk(
	userId: string,
): Promise<{ accessToken: string | null; refreshToken: string | null }> {
	const client = await getClerkBackendClient();
	const clerkUser = await client.users.getUser(userId);
	const privateMeta = (clerkUser.privateMetadata || {}) as {
		intervalsAccessToken?: string;
		intervalsRefreshToken?: string;
	};

	return {
		accessToken: privateMeta.intervalsAccessToken ?? null,
		refreshToken: privateMeta.intervalsRefreshToken ?? null,
	};
}

/**
 * Intervals.icu 連携解除時などに Clerk の privateMetadata からトークンを削除する
 */
export async function clearIntervalsTokensFromClerk(
	userId: string,
): Promise<void> {
	const client = await getClerkBackendClient();
	await client.users.updateUserMetadata(userId, {
		privateMetadata: {
			intervalsAccessToken: null,
			intervalsRefreshToken: null,
		},
	});
}
