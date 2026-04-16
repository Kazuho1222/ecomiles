import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import 'dotenv/config'

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  try {
    console.log('--- データの削除を開始します ---')
    
    // 外部キー制約があるため、Point -> Activity -> User の順で削除します
    const deletedPoints = await prisma.point.deleteMany()
    console.log(`削除済み: Points (${deletedPoints.count}件)`)

    const deletedActivities = await prisma.activity.deleteMany()
    console.log(`削除済み: Activities (${deletedActivities.count}件)`)

    const deletedUsers = await prisma.user.deleteMany()
    console.log(`削除済み: Users (${deletedUsers.count}件)`)

    console.log('--- すべてのデータがクリアされました ---')
  } catch (error) {
    console.error('エラーが発生しました:', error)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

main()
