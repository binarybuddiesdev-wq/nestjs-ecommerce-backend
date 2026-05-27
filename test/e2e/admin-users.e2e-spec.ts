import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
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
import { UsersModule } from '@/modules/users/users.module.js';
import { CloudinaryModule } from '@/modules/cloudinary/cloudinary.module.js';
import { CloudinaryService } from '@/modules/cloudinary/cloudinary.service.js';
import { PrismaService } from '@/prisma/prisma.service.js';
import { UserRole } from '@/types/index.js';

describe('Admin Users (e2e)', () => {
    let app: NestFastifyApplication;
    let prisma: PrismaService;

    const adminUser = {
        email: 'admin-e2e@example.com',
        password: 'AdminPass123!',
        name: 'Admin User',
    };

    const regularUser = {
        email: 'customer-e2e@example.com',
        password: 'CustomerPass123!',
        name: 'Customer User',
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
                CloudinaryModule,
                UsersModule,
            ],
        })
        .overrideProvider(CloudinaryService)
        .useValue({
            uploadImage: vi.fn().mockResolvedValue('https://cloudinary/mock-avatar.jpg'),
        })
        .compile();

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
    });

    afterAll(async () => {
        try {
            await prisma.refreshToken.deleteMany({ where: { userId: { not: '' } } });
        } catch { }
        try {
            await prisma.user.deleteMany({
                where: {
                    email: { in: [adminUser.email, regularUser.email] },
                },
            });
        } catch { }
        await app.close();
    });

    let adminToken: string;
    let customerToken: string;
    let targetUserId: string;

    it('Setup: Register and login users, promote adminUser to ADMIN role', async () => {
        // Register regular user
        const regCustomer = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/register',
            payload: regularUser,
        });
        expect(regCustomer.statusCode).toBe(201);
        const customerBody = JSON.parse(regCustomer.body);
        targetUserId = customerBody.data.id;

        // Register admin user
        const regAdmin = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/register',
            payload: adminUser,
        });
        expect(regAdmin.statusCode).toBe(201);

        // Directly update admin role in DB
        await prisma.user.update({
            where: { email: adminUser.email },
            data: { role: UserRole.ADMIN },
        });

        // Login regular user to get token
        const loginCustomer = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/login',
            payload: { email: regularUser.email, password: regularUser.password },
        });
        expect(loginCustomer.statusCode).toBe(200);
        customerToken = JSON.parse(loginCustomer.body).data.accessToken;

        // Login admin user to get token
        const loginAdmin = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/login',
            payload: { email: adminUser.email, password: adminUser.password },
        });
        expect(loginAdmin.statusCode).toBe(200);
        adminToken = JSON.parse(loginAdmin.body).data.accessToken;

        expect(customerToken).toBeTruthy();
        expect(adminToken).toBeTruthy();
    });

    it('GET /api/v1/admin/users — returns list of all users for admin', async () => {
        const result = await app.inject({
            method: 'GET',
            url: '/api/v1/admin/users',
            headers: { authorization: `Bearer ${adminToken}` },
        });

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(body.success).toBe(true);
        expect(body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('GET /api/v1/admin/users — rejects request from non-admin with 403', async () => {
        const result = await app.inject({
            method: 'GET',
            url: '/api/v1/admin/users',
            headers: { authorization: `Bearer ${customerToken}` },
        });

        expect(result.statusCode).toBe(403);
    });

    it('PATCH /api/v1/admin/users/:id/role — updates user role by admin', async () => {
        const result = await app.inject({
            method: 'PATCH',
            url: `/api/v1/admin/users/${targetUserId}/role`,
            headers: { authorization: `Bearer ${adminToken}` },
            payload: { role: UserRole.SELLER },
        });

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(body.data.role).toBe(UserRole.SELLER);
    });

    it('PATCH /api/v1/admin/users/:id/role — rejects request from non-admin with 403', async () => {
        const result = await app.inject({
            method: 'PATCH',
            url: `/api/v1/admin/users/${targetUserId}/role`,
            headers: { authorization: `Bearer ${customerToken}` },
            payload: { role: UserRole.ADMIN },
        });

        expect(result.statusCode).toBe(403);
    });

    it('DELETE /api/v1/admin/users/:id — soft deletes user by admin', async () => {
        const result = await app.inject({
            method: 'DELETE',
            url: `/api/v1/admin/users/${targetUserId}`,
            headers: { authorization: `Bearer ${adminToken}` },
        });

        expect(result.statusCode).toBe(200);

        // Verify user is now inactive in DB
        const user = await prisma.user.findUnique({ where: { id: targetUserId } });
        expect(user?.isActive).toBe(false);
    });

    it('DELETE /api/v1/admin/users/:id — rejects request from non-admin with 401 or 403', async () => {
        const result = await app.inject({
            method: 'DELETE',
            url: `/api/v1/admin/users/${targetUserId}`,
            headers: { authorization: `Bearer ${customerToken}` },
        });

        // 401 if JWT strategy rejects (user was soft-deleted) or 403 if roles guard rejects
        expect([401, 403]).toContain(result.statusCode);
    });
});
