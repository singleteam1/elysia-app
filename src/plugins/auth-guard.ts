import { Elysia } from 'elysia'

import { UnauthorizedError } from '~/lib/errors'
import { verifyAccessToken } from '~/lib/security/jwt'

const BEARER_PREFIX = 'Bearer '

export const readBearerToken = (authorization: string | undefined) => {
	if (!authorization?.startsWith(BEARER_PREFIX)) {
		return undefined
	}

	return authorization.slice(BEARER_PREFIX.length)
}

export const authGuard = new Elysia({ name: 'auth-guard' }).macro({
	auth: {
		async resolve({ headers }) {
			const token = readBearerToken(headers.authorization)

			if (!token) {
				throw new UnauthorizedError('Authentication required')
			}

			const user = await verifyAccessToken(token)

			return { user }
		}
	}
})
