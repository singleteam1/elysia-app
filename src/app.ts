import { openapi } from '@elysiajs/openapi'
import { Elysia } from 'elysia'

import { auth } from '~/modules/auth'
import { errorHandler } from '~/plugins/error-handler'
import { throttler } from '~/plugins/rate-limit'
import { requestId } from '~/plugins/request-id'

export const createApp = () =>
	new Elysia()
		.use(requestId)
		.use(throttler)
		.use(openapi({ provider: 'scalar', path: '/docs', specPath: '/spec.json' }))
		.use(errorHandler)
		.use(auth)

export type App = ReturnType<typeof createApp>
