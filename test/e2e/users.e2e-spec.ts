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
import { ALREADY_SELLER } from '@/common/index.js';

describe('Users (e2e)', () => {
    let app: NestFastifyApplication;
    let prisma: PrismaService;

    const testUser = {
        email: 'user-e2e@example.com',
        password: 'StrongPass123!',
        name: 'User E2E Test',
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
            await prisma.user.deleteMany({ where: { email: testUser.email } });
        } catch { }
        await app.close();
    });

    let accessToken: string;
    let addressId: string;

    it('Register and login to get token', async () => {
        const regRes = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/register',
            payload: testUser,
        });
        expect(regRes.statusCode).toBe(201);

        const loginRes = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/login',
            payload: { email: testUser.email, password: testUser.password },
        });
        expect(loginRes.statusCode).toBe(200);

        const body = JSON.parse(loginRes.body);
        accessToken = body.data.accessToken;
        expect(accessToken).toBeTruthy();
    });

    it('GET /api/v1/users/me — returns own profile', async () => {
        const result = await app.inject({
            method: 'GET',
            url: '/api/v1/users/me',
            headers: { authorization: `Bearer ${accessToken}` },
        });

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(body.success).toBe(true);
        expect(body.data.email).toBe(testUser.email);
        expect(body.data.role).toBe(UserRole.CUSTOMER);
    });

    it('PATCH /api/v1/users/me — updates profile', async () => {
        const result = await app.inject({
            method: 'PATCH',
            url: '/api/v1/users/me',
            headers: { authorization: `Bearer ${accessToken}` },
            payload: { name: 'New E2E Name' },
        });

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(body.data.name).toBe('New E2E Name');
    });

    it('POST /api/v1/users/me/addresses — adds address', async () => {
        const payload = {
            label: 'Home',
            street: '123 E2E Street',
            city: 'Hyderabad',
            state: 'Telangana',
            zipCode: '500081',
            country: 'INDIA',
            isDefault: true,
        };

        const result = await app.inject({
            method: 'POST',
            url: '/api/v1/users/me/address',
            headers: { authorization: `Bearer ${accessToken}` },
            payload,
        });

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(body.data.address.length).toBe(1);
        expect(body.data.address[0].label).toBe('Home');
        addressId = body.data.address[0].id;
        expect(addressId).toBeTruthy();
    });

    it('GET /api/v1/users/me/addresses — returns addresses', async () => {
        const result = await app.inject({
            method: 'GET',
            url: '/api/v1/users/me/address',
            headers: { authorization: `Bearer ${accessToken}` },
        });

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(body.data.length).toBe(1);
        expect(body.data[0].id).toBe(addressId);
    });

    it('PATCH /api/v1/users/me/addresses/:id — updates address', async () => {
        const result = await app.inject({
            method: 'PATCH',
            url: `/api/v1/users/me/address/${addressId}`,
            headers: { authorization: `Bearer ${accessToken}` },
            payload: {
                label: 'Home',
                street: '456 New E2E Street',
                city: 'Hyderabad',
                state: 'Telangana',
                zipCode: '500081',
                country: 'INDIA',
                isDefault: true,
            },
        });

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        const updatedAddress = body.data.address.find((a: any) => a.id === addressId);
        expect(updatedAddress.street).toBe('456 New E2E Street');
    });

    it('DELETE /api/v1/users/me/addresses/:id — deletes address', async () => {
        const result = await app.inject({
            method: 'DELETE',
            url: `/api/v1/users/me/address/${addressId}`,
            headers: { authorization: `Bearer ${accessToken}` },
        });

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(body.data.address.length).toBe(0);
    });

    it('POST /api/v1/users/me/become-seller — changes role to SELLER', async () => {
        const result = await app.inject({
            method: 'POST',
            url: '/api/v1/users/me/become-seller',
            headers: { authorization: `Bearer ${accessToken}` },
        });

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(body.data.role).toBe(UserRole.SELLER);
    });

    it('POST /api/v1/users/me/become-seller again — returns 400 Bad Request', async () => {
        const result = await app.inject({
            method: 'POST',
            url: '/api/v1/users/me/become-seller',
            headers: { authorization: `Bearer ${accessToken}` },
        });

        expect(result.statusCode).toBe(400);
        const body = JSON.parse(result.body);
        expect(body.message).toBe(ALREADY_SELLER);
    });
});
