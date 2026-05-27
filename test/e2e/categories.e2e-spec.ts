import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ValidationPipe } from '@nestjs/common';

import { GlobalExceptionFilter } from '@/common/filters/http-exception.filter.js';
import { TransformInterceptor } from '@/common/interceptors/transform.interceptor.js';
import { PrismaModule } from '@/prisma/prisma.module.js';
import { AuthModule } from '@/modules/auth/auth.module.js';
import { CategoriesModule } from '@/modules/categories/categories.module.js';
import { PrismaService } from '@/prisma/prisma.service.js';

// ─── NOTE ─────────────────────────────────────────────────────────────────────
// Admin-mutating tests (POST/PATCH/DELETE with admin token) are skipped because
// the E2E environment does not have a pre-seeded admin account. Access-control
// tests (401 / 403) are fully covered using a customer token which is created
// and destroyed within this suite's lifecycle.
// ──────────────────────────────────────────────────────────────────────────────

describe('Categories (e2e)', () => {
    let app: NestFastifyApplication;
    let prisma: PrismaService;

    const testUser = {
        email: 'cat-e2e@example.com',
        password: 'StrongPass123!',
        name: 'Category E2E User',
    };

    let customerToken: string;
    let seededCategoryId: string;
    const seededSlug = 'e2e-electronics-test';

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
                LoggerModule.forRoot({ pinoHttp: { level: 'silent' } }),
                PrismaModule,
                PassportModule.register({ defaultStrategy: 'jwt' }),
                JwtModule.register({ secret: 'test-secret', signOptions: { expiresIn: '15m' } }),
                AuthModule,
                CategoriesModule,
            ],
        }).compile();

        app = moduleFixture.createNestApplication<NestFastifyApplication>(
            new FastifyAdapter(),
        );

        app.useGlobalPipes(
            new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
        );
        app.useGlobalFilters(new GlobalExceptionFilter());
        app.useGlobalInterceptors(new TransformInterceptor());
        app.setGlobalPrefix('api/v1');
        app.enableShutdownHooks();

        await app.init();
        await app.getHttpAdapter().getInstance().ready();

        prisma = app.get<PrismaService>(PrismaService);

        // Register and log in a customer to get an auth token
        await app.inject({
            method: 'POST',
            url: '/api/v1/auth/register',
            payload: testUser,
        });

        const loginRes = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/login',
            payload: { email: testUser.email, password: testUser.password },
        });

        customerToken = JSON.parse(loginRes.body).data.accessToken;

        // Seed one category directly so GET tests have stable data
        const seeded = await prisma.category.create({
            data: { name: 'E2E Electronics Test', slug: seededSlug },
        });
        seededCategoryId = seeded.id;
    });

    afterAll(async () => {
        try {
            await prisma.category.deleteMany({ where: { slug: { startsWith: 'e2e-' } } });
        } catch { /* ignore */ }
        try {
            await prisma.refreshToken.deleteMany({ where: { userId: { not: '' } } });
        } catch { /* ignore */ }
        try {
            await prisma.user.deleteMany({ where: { email: testUser.email } });
        } catch { /* ignore */ }
        await app.close();
    });

    // ─── Public GET endpoints ──────────────────────────────────────────────────

    it('GET /api/v1/categories — public, no auth — returns category tree', async () => {
        const result = await app.inject({
            method: 'GET',
            url: '/api/v1/categories',
        });

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(body.success).toBe(true);
        expect(Array.isArray(body.data)).toBe(true);
    });

    it('GET /api/v1/categories/:slug — valid slug — returns the category', async () => {
        const result = await app.inject({
            method: 'GET',
            url: `/api/v1/categories/${seededSlug}`,
        });

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(body.success).toBe(true);
        expect(body.data.slug).toBe(seededSlug);
        expect(body.data.id).toBe(seededCategoryId);
    });

    it('GET /api/v1/categories/:slug — invalid slug — returns 404', async () => {
        const result = await app.inject({
            method: 'GET',
            url: '/api/v1/categories/this-slug-does-not-exist-anywhere',
        });

        expect(result.statusCode).toBe(404);
        const body = JSON.parse(result.body);
        expect(body.success).toBe(false);
    });

    // ─── Admin — access control ────────────────────────────────────────────────

    it('POST /api/v1/admin/categories — no auth — returns 401', async () => {
        const result = await app.inject({
            method: 'POST',
            url: '/api/v1/admin/categories',
            payload: { name: 'Unauthorized Category' },
        });

        expect(result.statusCode).toBe(401);
    });

    it('POST /api/v1/admin/categories — customer token — returns 403', async () => {
        const result = await app.inject({
            method: 'POST',
            url: '/api/v1/admin/categories',
            headers: { authorization: `Bearer ${customerToken}` },
            payload: { name: 'Customer Forbidden Category' },
        });

        expect(result.statusCode).toBe(403);
    });

    it('PATCH /api/v1/admin/categories/:id — customer token — returns 403', async () => {
        const result = await app.inject({
            method: 'PATCH',
            url: `/api/v1/admin/categories/${seededCategoryId}`,
            headers: { authorization: `Bearer ${customerToken}` },
            payload: { name: 'Forbidden Update' },
        });

        expect(result.statusCode).toBe(403);
    });

    it('DELETE /api/v1/admin/categories/:id — customer token — returns 403', async () => {
        const result = await app.inject({
            method: 'DELETE',
            url: `/api/v1/admin/categories/${seededCategoryId}`,
            headers: { authorization: `Bearer ${customerToken}` },
        });

        expect(result.statusCode).toBe(403);
    });

    // ─── NOTE: Admin token tests skipped ──────────────────────────────────────
    //
    // POST /api/v1/admin/categories with admin token — SKIPPED
    // Reason: No admin user is pre-seeded in the test environment.
    // These flows are covered by the service unit tests (createCategory,
    // updateCategory, deleteCategory) which mock Prisma directly.
    //
    // ──────────────────────────────────────────────────────────────────────────
});
