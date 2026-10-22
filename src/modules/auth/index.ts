import { Elysia } from 'elysia'

import { authGuard } from '~/plugins/auth-guard'

import { AuthResponse, LoginBody, RegisterBody, UserResponse } from './model'
import { getCurrentUser, login, register } from './service'

export const auth = new Elysia({ prefix: '/auth', tags: ['Authentication'] })
	.use(authGuard)
	.model({ RegisterBody, LoginBody, AuthResponse, UserResponse })
	.post('/register', ({ body }) => register(body), {
		body: 'RegisterBody',
		response: 'AuthResponse',
		detail: {
			summary: 'Register user',
			description: 'Creates a new user account and returns a JWT access token.'
		}
	})
	.post('/login', ({ body }) => login(body), {
		body: 'LoginBody',
		response: 'AuthResponse',
		detail: {
			summary: 'User login',
			description: 'Authenticates user credentials and returns a JWT access token.'
		}
	})
	.get('/me', ({ user }) => getCurrentUser(user.sub), {
		auth: true,
		response: 'UserResponse',
		detail: {
			summary: 'Get current user profile',
			description: 'Returns profile details for the currently authenticated user.'
		}
	})
