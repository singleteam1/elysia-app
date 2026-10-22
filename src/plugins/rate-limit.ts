import { Elysia } from 'elysia'
import { rateLimit } from 'elysia-rate-limit'

import { env } from '~/config/env'

const getClientIp = (request: Request, server: Elysia['server']): string => {
	const cfIp = request.headers.get('cf-connecting-ip')
	if (cfIp) return cfIp.trim()

	const xRealIp = request.headers.get('x-real-ip')
	if (xRealIp) return xRealIp.trim()

	const xForwardedFor = request.headers.get('x-forwarded-for')
	if (xForwardedFor) {
		const first = xForwardedFor.split(',')[0]?.trim()
		if (first) return first
	}

	return server?.requestIP(request)?.address ?? '127.0.0.1'
}

export const throttler = rateLimit({
	duration: env.RATE_LIMIT_WINDOW_MS,
	max: env.RATE_LIMIT_MAX,
	headers: true,
	scoping: 'global',
	countFailedRequest: true,
	generator: (req, server) => getClientIp(req, server),
	errorResponse: new Response(
		JSON.stringify({
			status: 429,
			messages: ['Too many requests, please try again later']
		}),
		{
			status: 429,
			headers: {
				'Content-Type': 'application/json'
			}
		}
	),
	skip: (request) => {
		const url = new URL(request.url)
		return url.pathname.startsWith('/docs') || url.pathname.startsWith('/spec.json')
	}
})
