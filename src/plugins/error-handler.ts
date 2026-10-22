import { Elysia } from 'elysia'

import { AppError } from '~/lib/errors'

export const errorHandler = new Elysia({ name: 'error-handler' })
	.error({ APP_ERROR: AppError })
	.onError({ as: 'global' }, ({ code, error, set }) => {
		if (code === 'VALIDATION') {
			set.status = 422
			return { status: 422, messages: [error.message] }
		}
		if (error instanceof AppError) {
			set.status = error.statusCode
			return { status: error.statusCode, messages: [error.message] }
		}
		set.status = 500
		return { status: 500, messages: ['Internal server error'] }
	})
