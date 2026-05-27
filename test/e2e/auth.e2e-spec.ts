import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { GlobalExceptionFilter } from '@/common/filters/http-exception.filter.js';
import { TransformInterceptor } from '@/common/interceptors/transform.interceptor.js';
import { ValidationPipe } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module.js';
import { AuthModule } from '@/modules/auth/auth.module.js';
import { AuthService } from '@/modules/auth/auth.service.js';
import { PrismaService } from '@/prisma/prisma.service.js';

describe('Auth (e2e)', () => {
    let app: NestFastifyApplication;
    let prisma: PrismaService;
    let authService: AuthService;

    const testUser = {
        email: 'e2e-test@example.com',
        password: 'StrongPass123!',
        name: 'E2E Test User',
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({
                    isGlobal: true,
                    load: [
                        () => ({
                            port: 0,
                            nodeEnv: 'test',
                            databaseUrl: '',
                            JWT_SECRET: 'test-secret',
                            REFRESH_TOKEN_EXPIRY: 604800000,
                        }),
                    ],
                }),
                LoggerModule.forRoot({
                    pinoHttp: {
                        level: 'silent',
                    },
                }),
                PrismaModule,
                PassportModule.register({ defaultStrategy: 'jwt' }),
                JwtModule.register({ secret: 'test-secret', signOptions: { expiresIn: '15m' } }),
                AuthModule,
            ],
        }).compile();

        app = moduleFixture.createNestApplication<NestFastifyApplication>(
            new FastifyAdapter(),
        );

        app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
        app.useGlobalFilters(new GlobalExceptionFilter());
        app.useGlobalInterceptors(new TransformInterceptor());
        app.setGlobalPrefix('api/v1');
        app.enableShutdownHooks();

        await app.init();
        await app.getHttpAdapter().getInstance().ready();

        prisma = app.get<PrismaService>(PrismaService);
        authService = app.get<AuthService>(AuthService);
    });

    afterAll(async () => {
        try {
            await prisma.refreshToken.deleteMany({ where: { userId: { not: '' } } });
        } catch { }
        try {
            await prisma.user.deleteMany({ where: { email: testUser.email } });
        } catch { }
        await app.close();
    });

    let accessToken: string;
    let refreshToken: string;

    it('POST /auth/register - creates a new user', async () => {
        const result = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/register',
            payload: testUser,
        });

        expect(result.statusCode).toBe(201);
        const body = JSON.parse(result.body);
        expect(body.success).toBe(true);
        expect(body.data.email).toBe(testUser.email);
        expect(body.data.name).toBe(testUser.name);
        expect(body.data).not.toHaveProperty('password');
    });

    it('POST /auth/register - rejects duplicate email', async () => {
        const result = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/register',
            payload: testUser,
        });

        expect(result.statusCode).toBe(409);
    });

    it('POST /auth/login - authenticates and returns tokens', async () => {
        const result = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/login',
            payload: { email: testUser.email, password: testUser.password },
        });

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(body.data.accessToken).toBeTruthy();
        expect(body.data.refreshToken).toBeTruthy();
        expect(body.data.user.email).toBe(testUser.email);

        accessToken = body.data.accessToken;
        refreshToken = body.data.refreshToken;
    });

    it('POST /auth/login - rejects wrong password', async () => {
        const result = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/login',
            payload: { email: testUser.email, password: 'wrong' },
        });

        expect(result.statusCode).toBe(401);
    });

    it('GET /auth/me - returns current user profile', async () => {
        const result = await app.inject({
            method: 'GET',
            url: '/api/v1/auth/me',
            headers: { authorization: `Bearer ${accessToken}` },
        });

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(body.data.email).toBe(testUser.email);
    });

    it('GET /auth/me - rejects without token', async () => {
        const result = await app.inject({
            method: 'GET',
            url: '/api/v1/auth/me',
        });

        expect(result.statusCode).toBe(401);
    });

    it('POST /auth/refresh - returns new tokens', async () => {
        const result = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/refresh',
            payload: { refreshToken },
        });

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(body.data.accessToken).toBeTruthy();
        expect(body.data.refreshToken).toBeTruthy();

        accessToken = body.data.accessToken;

        const oldRefreshToken = refreshToken;
        refreshToken = body.data.refreshToken;

        const oldResult = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/refresh',
            payload: { refreshToken: oldRefreshToken },
        });
        expect(oldResult.statusCode).toBe(401);
    });

    it('POST /auth/logout - revokes refresh tokens', async () => {
        const result = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/logout',
            headers: { authorization: `Bearer ${accessToken}` },
        });

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body).message).toBeTruthy();

        const refreshResult = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/refresh',
            payload: { refreshToken },
        });
        expect(refreshResult.statusCode).toBe(401);
    });
});
