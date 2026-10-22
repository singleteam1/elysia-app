import { Elysia } from 'elysia'

import { ForbiddenError, UnauthorizedError } from '~/lib/errors'
import { type AccessTokenPayload, type Role, verifyAccessToken } from '~/lib/security/jwt'

const BEARER_PREFIX = 'Bearer '

export const readBearerToken = (authorization: string | null | undefined) => {
	if (!authorization?.startsWith(BEARER_PREFIX)) {
		return undefined
	}

	return authorization.slice(BEARER_PREFIX.length)
}

const authenticateUser = async (
	authorization: string | null | undefined
): Promise<AccessTokenPayload> => {
	const token = readBearerToken(authorization)

	if (!token) {
		throw new UnauthorizedError('Authentication required')
	}

	return verifyAccessToken(token)
}

export const authGuard = new Elysia({ name: 'auth-guard' }).macro({
	auth: {
		async resolve({
			request,
			headers
		}: {
			request: Request
			headers?: Record<string, string | undefined>
		}) {
			const authHeader = request.headers.get('authorization') ?? headers?.authorization
			const user = await authenticateUser(authHeader)

			return { user }
		}
	},
	roles: (allowed: Role | Role[]) => ({
		async resolve({
			request,
			headers,
			user
		}: {
			request: Request
			headers?: Record<string, string | undefined>
			user?: AccessTokenPayload
		}) {
			const authHeader = request.headers.get('authorization') ?? headers?.authorization
			const currentUser = user ?? (await authenticateUser(authHeader))
			const rolesArray = Array.isArray(allowed) ? allowed : [allowed]

			if (!rolesArray.includes(currentUser.role)) {
				throw new ForbiddenError('Insufficient permissions')
			}

			return { user: currentUser }
		}
	})
})
