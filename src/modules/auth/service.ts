import { ConflictError, UnauthorizedError } from '~/lib/errors'
import { signAccessToken } from '~/lib/security/jwt'

import type { LoginBody, RegisterBody } from './model'
import { createUser, findUserByEmail, findUserById } from './repository'

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
		name: input.name
	})

	const accessToken = await signAccessToken({ sub: user.id, email: user.email })

	return { accessToken, user }
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

	const accessToken = await signAccessToken({ sub: user.id, email: user.email })

	return {
		accessToken,
		user: {
			id: user.id,
			email: user.email,
			name: user.name,
			createdAt: user.createdAt
		}
	}
}

export const getCurrentUser = async (userId: string) => {
	const user = await findUserById(userId)

	if (!user) {
		throw new UnauthorizedError('User not found')
	}

	return user
}
