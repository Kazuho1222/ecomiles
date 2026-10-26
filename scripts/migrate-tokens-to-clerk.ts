import pg from "pg";
import "dotenv/config";
import { saveIntervalsTokensToClerk, getIntervalsTokensFromClerk } from "../src/lib/intervals-token-storage";

async function main() {
	console.log("🚀 Starting Intervals.icu token migration to Clerk privateMetadata...");

	const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

	try {
		// intervalsAccessToken を持っているユーザーを取得
		const result = await pool.query(`
			SELECT id, "intervalsAccessToken", "intervalsRefreshToken"
			FROM users
			WHERE "intervalsAccessToken" IS NOT NULL
		`);

		console.log(`Found ${result.rows.length} user(s) with Intervals.icu tokens to migrate.`);

		for (const row of result.rows) {
			const { id: userId, intervalsAccessToken, intervalsRefreshToken } = row;

			// Clerk ユーザーIDかどうかチェック (user_...)
			if (!userId.startsWith("user_")) {
				console.log(`⏩ Skipping non-Clerk user: ${userId}`);
				continue;
			}

			console.log(`⏳ Migrating tokens for Clerk user: ${userId}...`);

			await saveIntervalsTokensToClerk(userId, {
				access_token: intervalsAccessToken,
				refresh_token: intervalsRefreshToken || undefined,
			});

			// 検証: Clerk から正常に取得できるか確認
			const verified = await getIntervalsTokensFromClerk(userId);
			if (verified.accessToken === intervalsAccessToken) {
				console.log(`✅ Successfully migrated and verified tokens for user: ${userId}`);
			} else {
				throw new Error(`Verification failed for user ${userId}: token mismatch`);
			}
		}

		console.log("🎉 Token migration completed successfully!");
	} catch (error) {
		console.error("❌ Migration failed:", error);
		process.exit(1);
	} finally {
		await pool.end();
	}
}

main();
