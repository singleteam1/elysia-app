import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/generated/client'

import { env } from '~/config/env'

export const db = new PrismaClient({
	adapter: new PrismaPg({ connectionString: env.DATABASE_URL })
})

export const connectDatabase = async () => {
	await db.$connect()
}

export const disconnectDatabase = () => db.$disconnect()
