import { createHash, randomBytes } from 'node:crypto'

import { env, isProduction } from '~/config/env'

const TOKEN_BYTES = 32

export const REFRESH_COOKIE_NAME = 'refreshToken'

export const hashRefreshToken = (token: string): string =>
	createHash('sha256').update(token).digest('hex')

export interface GeneratedRefreshToken {
	token: string
	hash: string
}

export const generateRefreshToken = (): GeneratedRefreshToken => {
	const token = randomBytes(TOKEN_BYTES).toString('base64url')

	return { token, hash: hashRefreshToken(token) }
}

export const getRefreshCookieOptions = () => ({
	httpOnly: true,
	secure: isProduction,
	sameSite: 'lax' as const,
	path: '/auth',
	maxAge: env.REFRESH_TOKEN_TTL
})
