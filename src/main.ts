import { createApp } from '~/app'
import { bootstrap, shutdown } from '~/bootstrap'
import { env } from '~/config/env'

await bootstrap()

const app = createApp().listen(
	{ hostname: env.APP_ADDRESS, port: env.APP_PORT },
	({ hostname, port }) => {
		console.log(`Server listening on http://${hostname}:${port}`)
	}
)
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
	process.once(signal, async () => {
		await app.stop()
		await shutdown()
		process.exit(0)
	})
}
