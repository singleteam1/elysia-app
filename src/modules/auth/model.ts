import { type Static, t } from 'elysia'

export const RegisterBody = t.Object({
	email: t.String({ format: 'email', description: 'User email address' }),
	password: t.String({ minLength: 8, description: 'User password (minimum 8 characters)' }),
	name: t.Optional(t.String({ minLength: 2, description: 'User display name' }))
})
export type RegisterBody = Static<typeof RegisterBody>

export const LoginBody = t.Object({
	email: t.String({ format: 'email', description: 'User email address' }),
	password: t.String({ minLength: 1, description: 'User password' })
})
export type LoginBody = Static<typeof LoginBody>

export const UserResponse = t.Object({
	id: t.String({ description: 'User unique identifier' }),
	email: t.String({ description: 'User email address' }),
	name: t.Nullable(t.String({ description: 'User display name' })),
	createdAt: t.Date({ description: 'Account creation timestamp' })
})
export type UserResponse = Static<typeof UserResponse>

export const AuthResponse = t.Object({
	accessToken: t.String({ description: 'JWT access token' }),
	user: UserResponse
})
export type AuthResponse = Static<typeof AuthResponse>
