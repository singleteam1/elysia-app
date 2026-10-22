import { type Static, Type as t } from '@sinclair/typebox'
import { Value } from '@sinclair/typebox/value'

const envSchema = t.Object({
	NODE_ENV: t.Union([t.Literal('development'), t.Literal('production'), t.Literal('test')], {
		default: 'development'
	}),
	APP_PORT: t.Number({ default: 3000 }),
	APP_ADDRESS: t.String({ default: '0.0.0.0' }),
	DATABASE_URL: t.String(),
	JWT_SECRET: t.String({ minLength: 32 }),
	ACCESS_TOKEN_TTL: t.Number({ default: 15 * 60 }),
	REFRESH_TOKEN_TTL: t.Number({ default: 7 * 24 * 60 * 60 })
})

export type Env = Static<typeof envSchema>

const rawEnv = {
	...Bun.env,
	APP_ADDRESS: Bun.env.APP_ADDRESS ?? Bun.env.APP_HOST ?? '0.0.0.0'
}

const parsed = Value.Convert(envSchema, Value.Default(envSchema, Value.Clean(envSchema, rawEnv)))

if (!Value.Check(envSchema, parsed)) {
	console.error('Invalid environment variables:')

	for (const error of Value.Errors(envSchema, parsed)) {
		console.error(`  - ${error.path.slice(1)}: ${error.message}`)
	}

	process.exit(1)
}

export const env = parsed
export const isProduction = env.NODE_ENV === 'production'
