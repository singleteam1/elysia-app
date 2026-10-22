import { connectDatabase, disconnectDatabase } from '~/lib/db'

export const bootstrap = async () => {
	try {
		await connectDatabase()
	} catch (err) {
		console.error('Bootstrap failed', err)
		process.exit(1)
	}
}

export const shutdown = async () => {
	await Promise.allSettled([disconnectDatabase()])
}
