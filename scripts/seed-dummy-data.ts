import { PrismaClient, ActivityType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { config } from 'dotenv';

// .envファイルを読み込む
config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Generating dummy eco-athletes...');

  const dummyUsers = [
    { email: 'athlete.one@example.com', name: 'Eco Walker 🌿' },
    { email: 'athlete.two@example.com', name: 'Cycle Hero 🚲' },
    { email: 'athlete.three@example.com', name: 'Green Runner 🏃' },
  ];

  for (const userData of dummyUsers) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        id: `dummy-${Math.random().toString(36).substring(7)}`,
        email: userData.email,
        name: userData.name,
        stravaConnected: true,
        stravaAthleteId: `dummy-id-${Math.random().toString(10).substring(2, 8)}`,
      },
    });

    console.log(`Created user: ${user.name}`);

    // 各ユーザーに過去7日間のランダムなアクティビティを生成
    for (let i = 0; i < 5; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const types = [ActivityType.Run, ActivityType.Ride, ActivityType.Walk];
      const type = types[Math.floor(Math.random() * types.length)];
      const distance = Math.random() * 10 + 2; // 2km ~ 12km

      let pointsMultiplier = 1;
      if (type === ActivityType.Run) pointsMultiplier = 1.5;
      if (type === ActivityType.Walk) pointsMultiplier = 1.0;
      if (type === ActivityType.Ride) pointsMultiplier = 0.5;
      
      const pointsAwarded = Math.floor(distance * pointsMultiplier);

      await prisma.activity.create({
        data: {
          userId: user.id,
          stravaActivityId: `dummy-act-${Math.random().toString(36).substring(7)}`,
          activityType: type,
          distance: distance,
          activityDate: date,
          eligibleForPoints: true,
          pointsAwarded: pointsAwarded,
          points: {
            create: {
              userId: user.id,
              points: pointsAwarded,
              description: `Dummy Activity: ${type}`,
            }
          }
        },
      });
    }
  }

  console.log('✅ Dummy data generated successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
