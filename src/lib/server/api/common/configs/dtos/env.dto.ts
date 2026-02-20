import { z } from 'zod';

export const envsDto = z.object({
	DATABASE_URL: z.string().optional(),
	REDIS_URL: z.string().optional(),
	SIGNING_SECRET: z.string().optional(),
	PASETO_LOCAL_KEY_PASERK: z.string().optional(),
	ENV: z.enum(['dev', 'prod']).default('dev'),
	PACKAGE_NAME: z.string().optional(),
	0: z.string().optional(),
	STORAGE_HOST: z.string().optional(),
	STORAGE_PORT: z.number({ coerce: true }).optional(),
	STORAGE_REGION: z.string().optional(),
	STORAGE_ACCESS_KEY: z.string().optional(),
	STORAGE_SECRET_KEY: z.string().optional(),
	STORAGE_BUCKET: z.string().default('dev'),
	STORAGE_URL_STYLE: z.enum(['virtual', 'path']).optional(),
	STORAGE_FORCE_PATH_STYLE: z.boolean().optional()
});

export type EnvsDto = z.infer<typeof envsDto>;
