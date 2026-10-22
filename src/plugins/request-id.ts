import { Elysia } from 'elysia'

export interface RequestIdOptions {
	/**
	 * Name of the HTTP header used to read and set the request ID.
	 * @default 'X-Request-Id'
	 */
	headerName?: string
	/**
	 * Custom generator function to produce request IDs.
	 * Defaults to `crypto.randomUUID()`.
	 */
	generateId?: () => string
}

export const createRequestId = (options?: RequestIdOptions) => {
	const headerName = options?.headerName ?? 'X-Request-Id'
	const generateId = options?.generateId ?? (() => crypto.randomUUID())

	return new Elysia({ name: 'request-id' })
		.onRequest(({ request, set }) => {
			const existingId = request.headers.get(headerName)?.trim()
			const id = existingId || generateId()
			set.headers[headerName] = id
		})
		.derive({ as: 'global' }, ({ request, set }) => {
			const existingHeader = set.headers[headerName] as string | undefined
			const id = existingHeader || request.headers.get(headerName)?.trim() || generateId()
			set.headers[headerName] = id

			return {
				requestId: id
			}
		})
}

export const requestId = createRequestId()
