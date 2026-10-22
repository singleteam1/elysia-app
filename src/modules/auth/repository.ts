import { db } from '~/lib/db'

export const findUserByEmail = (email: string) =>
	db.user.findUnique({
		where: { email: email.toLowerCase() }
	})

export const findUserById = (id: string) =>
	db.user.findUnique({
		where: { id },
		select: {
			id: true,
			email: true,
			name: true,
			createdAt: true
		}
	})

export const createUser = (data: { email: string; passwordHash: string; name?: string }) =>
	db.user.create({
		data: {
			email: data.email.toLowerCase(),
			passwordHash: data.passwordHash,
			name: data.name
		},
		select: {
			id: true,
			email: true,
			name: true,
			createdAt: true
		}
	})
