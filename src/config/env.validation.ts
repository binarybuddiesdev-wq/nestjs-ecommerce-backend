import { z } from 'zod';

export const envSchema = z.object({
    PORT: z.coerce.number().default(3000),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    DATABASE_URL: z.string().optional(),
    CORS_ORIGIN: z.string().default('*'),
    JWT_SECRET: z.string().default('dev-secret-do-not-use-in-prod'),
    REFRESH_TOKEN_EXPIRY: z.coerce.number().default(604800000),
}).passthrough().refine((data) => {
    if (data.NODE_ENV !== 'test' && !data.DATABASE_URL) {
        return false;
    }
    return true;
}, {
    message: "DATABASE_URL is required when NODE_ENV is not 'test'",
    path: ['DATABASE_URL'],
});

export type TEnv = z.infer<typeof envSchema>;

export const validateEnv = (config: Record<string, unknown>) => {
    const result = envSchema.safeParse(config);
    if (!result.success) {
        const errors = JSON.stringify(result.error.format(), null, 2);
        throw new Error(`Invalid environment variables:\n${errors}`);
    }
    return result.data;
};
