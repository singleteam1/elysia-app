import { jwtVerify, SignJWT } from 'jose'

import { env } from '~/config/env'
import { UnauthorizedError } from '~/lib/errors'

const accessSecret = new TextEncoder().encode(env.JWT_SECRET)

export type Role = 'USER' | 'ADMIN'

export interface AccessTokenPayload {
	[claim: string]: unknown
	sub: string
	email: string
	role: Role
	type?: 'access'
}

export const signAccessToken = (payload: Omit<AccessTokenPayload, 'type'>): Promise<string> =>
	new SignJWT({ ...payload, type: 'access' })
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.setExpirationTime(`${env.ACCESS_TOKEN_TTL}s`)
		.sign(accessSecret)

export const verifyAccessToken = async (token: string): Promise<AccessTokenPayload> => {
	try {
		const { payload } = await jwtVerify(token, accessSecret)

		if (
			typeof payload.sub !== 'string' ||
			typeof payload.email !== 'string' ||
			(payload.role !== 'USER' && payload.role !== 'ADMIN') ||
			(payload.type !== undefined && payload.type !== 'access')
		) {
			throw new Error('Malformed access token payload')
		}

		return {
			sub: payload.sub,
			email: payload.email,
			role: payload.role as Role,
			type: 'access'
		}
	} catch {
		throw new UnauthorizedError('Invalid or expired access token')
	}
}
