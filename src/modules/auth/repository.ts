import { db } from '~/lib/db'
import type { Role } from '~/lib/security/jwt'

const userSelect = {
	id: true,
	email: true,
	name: true,
	role: true,
	createdAt: true
} as const

export const findUserByEmail = (email: string) =>
	db.user.findUnique({
		where: { email: email.toLowerCase() }
	})

export const findUserById = (id: string) =>
	db.user.findUnique({
		where: { id },
		select: userSelect
	})

export const createUser = (data: {
	email: string
	passwordHash: string
	name?: string
	role?: Role
}) =>
	db.user.create({
		data: {
			email: data.email.toLowerCase(),
			passwordHash: data.passwordHash,
			name: data.name,
			role: data.role ?? 'USER'
		},
		select: userSelect
	})

export interface NewRefreshToken {
	familyId: string
	tokenHash: string
	userId: string
	expiresAt: Date
}

export const createRefreshToken = (data: NewRefreshToken) =>
	db.refreshToken.create({
		data
	})

export const findRefreshTokenByHash = (tokenHash: string) =>
	db.refreshToken.findUnique({
		where: { tokenHash }
	})

export const markRefreshTokenUsed = (id: string) =>
	db.refreshToken.update({
		where: { id },
		data: { usedAt: new Date() }
	})

export const revokeRefreshToken = (id: string) =>
	db.refreshToken.update({
		where: { id },
		data: { revokedAt: new Date() }
	})

export const revokeRefreshTokenFamily = (familyId: string) =>
	db.refreshToken.updateMany({
		where: { familyId },
		data: { revokedAt: new Date() }
	})

export const rotateRefreshToken = (oldId: string, next: NewRefreshToken) =>
	db.$transaction(async (tx) => {
		const created = await tx.refreshToken.create({ data: next })

		await tx.refreshToken.update({
			where: { id: oldId },
			data: { usedAt: new Date() }
		})

		return created
	})

export const revokeAllUserRefreshTokens = (userId: string) =>
	db.refreshToken.updateMany({
		where: { userId },
		data: { revokedAt: new Date() }
	})
