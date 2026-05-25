import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import { NestFastifyApplication } from '@nestjs/platform-fastify';

export const registerFastifyPlugins = async (app: NestFastifyApplication) => {

    const nodeEnv = process.env.NODE_ENV ?? 'development';

    await app.register(fastifyHelmet, {
        global: true,
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"]
            }
        }
    });

    // await app.register(fastifyCors, { origin: '*' });
    await app.register(fastifyCors, {
        origin: nodeEnv === 'production'
            ? process.env.CORS_ORIGIN?.split(',') ?? []
            : '*'
    });

    await app.register(fastifyRateLimit, { max: 100, timeWindow: '1 minute' });

};