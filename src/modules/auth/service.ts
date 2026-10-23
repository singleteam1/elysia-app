import { randomUUID } from 'node:crypto'

import { env } from '~/config/env'
import { ConflictError, UnauthorizedError } from '~/lib/errors'
import { type Role, signAccessToken } from '~/lib/security/jwt'
import { generateRefreshToken, hashRefreshToken } from '~/lib/security/refresh-token'

import type { LoginBody, RegisterBody } from './model'
import {
	createRefreshToken,
	createUser,
	findRefreshTokenByHash,
	findUserByEmail,
	findUserById,
	revokeRefreshToken,
	revokeRefreshTokenFamily,
	rotateRefreshToken
} from './repository'

const refreshExpiresAt = () => new Date(Date.now() + env.REFRESH_TOKEN_TTL * 1000)

const issueTokenPair = async (user: { id: string; email: string; role: Role }) => {
	const refresh = generateRefreshToken()
	const familyId = randomUUID()

	await createRefreshToken({
		familyId,
		tokenHash: refresh.hash,
		userId: user.id,
		expiresAt: refreshExpiresAt()
	})

	const accessToken = await signAccessToken({
		sub: user.id,
		email: user.email,
		role: user.role
	})

	return {
		accessToken,
		refreshToken: refresh.token
	}
}

export const register = async (input: RegisterBody) => {
	const existing = await findUserByEmail(input.email)

	if (existing) {
		throw new ConflictError('User with this email already exists')
	}

	const passwordHash = await Bun.password.hash(input.password, {
		algorithm: 'argon2id',
		memoryCost: 65536,
		timeCost: 3
	})

	const user = await createUser({
		email: input.email,
		passwordHash,
		name: input.name,
		role: 'USER'
	})

	const { accessToken, refreshToken } = await issueTokenPair(user)

	return { accessToken, refreshToken, user }
}

export const login = async (input: LoginBody) => {
	const user = await findUserByEmail(input.email)

	if (!user) {
		throw new UnauthorizedError('Invalid email or password')
	}

	const isValid = await Bun.password.verify(input.password, user.passwordHash)

	if (!isValid) {
		throw new UnauthorizedError('Invalid email or password')
	}

	const userData = {
		id: user.id,
		email: user.email,
		name: user.name,
		role: user.role,
		createdAt: user.createdAt
	}

	const { accessToken, refreshToken } = await issueTokenPair(userData)

	return {
		accessToken,
		refreshToken,
		user: userData
	}
}

export const refreshSession = async (rawRefreshToken: string | undefined) => {
	if (!rawRefreshToken) {
		throw new UnauthorizedError('Refresh token required')
	}

	const tokenHash = hashRefreshToken(rawRefreshToken)
	const existing = await findRefreshTokenByHash(tokenHash)

	if (!existing || existing.expiresAt < new Date()) {
		throw new UnauthorizedError('Invalid or expired refresh token')
	}

	if (existing.revokedAt) {
		throw new UnauthorizedError('Refresh token revoked')
	}

	if (existing.usedAt) {
		await revokeRefreshTokenFamily(existing.familyId)

		throw new UnauthorizedError('Refresh token reuse detected. All sessions terminated.')
	}

	const user = await findUserById(existing.userId)

	if (!user) {
		throw new UnauthorizedError('User not found')
	}

	const accessToken = await signAccessToken({
		sub: user.id,
		email: user.email,
		role: user.role
	})

	return {
		accessToken,
		user
	}
}

export const logout = async (rawRefreshToken: string | undefined) => {
	if (rawRefreshToken) {
		const tokenHash = hashRefreshToken(rawRefreshToken)
		const existing = await findRefreshTokenByHash(tokenHash)

		if (existing && !existing.revokedAt) {
			await revokeRefreshToken(existing.id)
		}
	}

	return { message: 'Logged out successfully' }
}

export const getCurrentUser = async (userId: string) => {
	const user = await findUserById(userId)

	if (!user) {
		throw new UnauthorizedError('User not found')
	}

	return user
}
