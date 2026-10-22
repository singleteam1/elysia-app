import { Elysia } from 'elysia'

import { getRefreshCookieOptions } from '~/lib/security/refresh-token'
import { authGuard } from '~/plugins/auth-guard'

import {
	AdminResponse,
	AuthResponse,
	LoginBody,
	MessageResponse,
	RefreshCookie,
	RegisterBody,
	UserResponse
} from './model'
import { getCurrentUser, login, logout, refresh, register } from './service'

export const auth = new Elysia({ prefix: '/auth', tags: ['Authentication'] })
	.use(authGuard)
	.model({
		RegisterBody,
		LoginBody,
		AuthResponse,
		UserResponse,
		MessageResponse,
		AdminResponse,
		RefreshCookie
	})
	.post(
		'/register',
		async ({ body, cookie: { refreshToken } }) => {
			const result = await register(body)

			refreshToken.set({
				...getRefreshCookieOptions(),
				value: result.refreshToken
			})

			return {
				accessToken: result.accessToken,
				user: result.user
			}
		},
		{
			body: 'RegisterBody',
			response: 'AuthResponse',
			detail: {
				summary: 'Register user',
				description:
					'Creates a new user account with USER role, sets an HttpOnly refresh token cookie, and returns a JWT access token.'
			}
		}
	)
	.post(
		'/login',
		async ({ body, cookie: { refreshToken } }) => {
			const result = await login(body)

			refreshToken.set({
				...getRefreshCookieOptions(),
				value: result.refreshToken
			})

			return {
				accessToken: result.accessToken,
				user: result.user
			}
		},
		{
			body: 'LoginBody',
			response: 'AuthResponse',
			detail: {
				summary: 'User login',
				description:
					'Authenticates credentials, sets an HttpOnly refresh token cookie, and returns a JWT access token.'
			}
		}
	)
	.post(
		'/refresh',
		async ({ cookie: { refreshToken } }) => {
			try {
				const result = await refresh(refreshToken.value)

				refreshToken.set({
					...getRefreshCookieOptions(),
					value: result.refreshToken
				})

				return {
					accessToken: result.accessToken,
					user: result.user
				}
			} catch (err) {
				refreshToken.set({
					...getRefreshCookieOptions(),
					value: '',
					maxAge: 0,
					expires: new Date(0)
				})

				throw err
			}
		},
		{
			cookie: 'RefreshCookie',
			response: 'AuthResponse',
			detail: {
				summary: 'Refresh access token',
				description:
					'Uses the HttpOnly refresh token cookie to rotate refresh token and issue a fresh access token.'
			}
		}
	)
	.post(
		'/logout',
		async ({ cookie: { refreshToken } }) => {
			const result = await logout(refreshToken.value)

			refreshToken.set({
				...getRefreshCookieOptions(),
				value: '',
				maxAge: 0,
				expires: new Date(0)
			})

			return result
		},
		{
			cookie: 'RefreshCookie',
			response: 'MessageResponse',
			detail: {
				summary: 'Logout user',
				description:
					'Revokes the refresh token and clears the HttpOnly refresh token cookie.'
			}
		}
	)
	.get('/me', ({ user }) => getCurrentUser(user.sub), {
		auth: true,
		response: 'UserResponse',
		detail: {
			summary: 'Get current user profile',
			description: 'Returns profile details for the currently authenticated user.'
		}
	})
	.get(
		'/admin',
		({ user }) => ({
			message: 'Admin access granted',
			user
		}),
		{
			roles: ['ADMIN'],
			response: 'AdminResponse',
			detail: {
				summary: 'Admin only endpoint',
				description: 'Requires an authenticated user with ADMIN role.'
			}
		}
	)
