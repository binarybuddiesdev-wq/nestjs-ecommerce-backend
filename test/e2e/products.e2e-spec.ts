import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ValidationPipe } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';

import { GlobalExceptionFilter } from '@/common/filters/http-exception.filter.js';
import { TransformInterceptor } from '@/common/interceptors/transform.interceptor.js';
import { PrismaModule } from '@/prisma/prisma.module.js';
import { AuthModule } from '@/modules/auth/auth.module.js';
import { ProductsModule } from '@/modules/products/products.module.js';
import { CategoriesModule } from '@/modules/categories/categories.module.js';
import { PrismaService } from '@/prisma/prisma.service.js';
import { UserRole } from '@/types/index.js';
import { CloudinaryService } from '@/modules/cloudinary/cloudinary.service.js';
import { CloudinaryModule } from '@/modules/cloudinary/cloudinary.module.js';
import { PRODUCT_NOT_OWNER } from '@/common/index.js';

// Mock parseMultipartForm to extract fields from JSON body during E2E injections
vi.mock('@/common/helpers/index.js', async (importOriginal) => {
  const original = await importOriginal<any>();
  return {
    ...original,
    parseMultipartForm: vi.fn(async (req: any) => {
      const body = req.body || {};
      const fields: Record<string, string> = {};
      for (const [key, value] of Object.entries(body)) {
        if (key !== 'filePaths') {
          fields[key] = String(value);
        }
      }
      return {
        fields,
        filePaths: body.filePaths || [],
      };
    }),
  };
});

describe('Products (e2e)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;

  const sellerUser = {
    email: 'seller-e2e@example.com',
    password: 'StrongPass123!',
    name: 'Seller E2E',
  };

  const otherSellerUser = {
    email: 'other-seller-e2e@example.com',
    password: 'StrongPass123!',
    name: 'Other Seller E2E',
  };

  const customerUser = {
    email: 'cust-e2e@example.com',
    password: 'StrongPass123!',
    name: 'Customer E2E',
  };

  let sellerToken: string;
  let otherSellerToken: string;
  let customerToken: string;

  let categoryId: string;
  let createdProductId: string;
  let createdProductSlug: string;

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
        CacheModule.register({ isGlobal: true }),
        PrismaModule,
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({ secret: 'test-secret', signOptions: { expiresIn: '15m' } }),
        AuthModule,
        CategoriesModule,
        ProductsModule,
        CloudinaryModule,
      ],
    })
    .overrideProvider(CloudinaryService)
    .useValue({
      uploadImage: vi.fn().mockResolvedValue('https://cloudinary/mock-product.jpg'),
      uploadImages: vi.fn().mockResolvedValue(['https://cloudinary/mock-product.jpg']),
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

    // Create a test category
    const cat = await prisma.category.create({
      data: { name: 'E2E Product Category', slug: 'e2e-product-category' },
    });
    categoryId = cat.id;

    // Helper function to register and login users
    const registerAndLogin = async (user: typeof sellerUser, role: UserRole) => {
      await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: user,
      });

      // Directly promote to SELLER or CUSTOMER role if needed
      await prisma.user.update({
        where: { email: user.email },
        data: { role },
      });

      const loginRes = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: { email: user.email, password: user.password },
      });

      return JSON.parse(loginRes.body).data.accessToken;
    };

    sellerToken = await registerAndLogin(sellerUser, UserRole.SELLER);
    otherSellerToken = await registerAndLogin(otherSellerUser, UserRole.SELLER);
    customerToken = await registerAndLogin(customerUser, UserRole.CUSTOMER);
  });

  afterAll(async () => {
    try {
      await prisma.product.deleteMany({ where: { slug: { startsWith: 'e2e-' } } });
    } catch {}
    try {
      await prisma.category.deleteMany({ where: { slug: 'e2e-product-category' } });
    } catch {}
    try {
      await prisma.refreshToken.deleteMany({ where: { userId: { not: '' } } });
    } catch {}
    try {
      await prisma.user.deleteMany({
        where: {
          email: { in: [sellerUser.email, otherSellerUser.email, customerUser.email] },
        },
      });
    } catch {}
    await app.close();
  });

  // ─── POST /api/v1/products — Create Product ──────────────────────────────
  it('POST /api/v1/products — Seller can create a product', async () => {
    const payload = {
      name: 'E2E Test Product',
      description: 'An awesome test product',
      price: 1500,
      stock: 5,
      categoryId,
      brand: 'E2E Brand',
      tags: 'e2e,test',
    };

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/products',
      headers: { authorization: `Bearer ${sellerToken}` },
      payload,
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.data.name).toBe(payload.name);
    expect(body.data.slug).toBe('e2e-test-product');
    expect(body.data.price).toBe(1500);

    createdProductId = body.data.id;
    createdProductSlug = body.data.slug;
  });

  it('POST /api/v1/products — Customer cannot create a product (403)', async () => {
    const payload = {
      name: 'Forbidden Product',
      description: 'Cust cannot create',
      price: 10,
      stock: 1,
      categoryId,
    };

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/products',
      headers: { authorization: `Bearer ${customerToken}` },
      payload,
    });

    expect(res.statusCode).toBe(403);
  });

  // ─── GET /api/v1/products — List Products ────────────────────────────────
  it('GET /api/v1/products — returns products list (Public)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/products',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.data.products.length).toBeGreaterThanOrEqual(1);
  });

  // ─── GET /api/v1/products/:slug — Product Detail ─────────────────────────
  it('GET /api/v1/products/:slug — returns product details (Public)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/products/${createdProductSlug}`,
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.id).toBe(createdProductId);
  });

  // ─── PATCH /api/v1/products/:id — Update Product ─────────────────────────
  it('PATCH /api/v1/products/:id — Seller owner can update product', async () => {
    const payload = {
      name: 'E2E Test Product Updated',
      price: 1999,
    };

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/products/${createdProductId}`,
      headers: { authorization: `Bearer ${sellerToken}` },
      payload,
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.name).toBe(payload.name);
    expect(body.data.price).toBe(1999);
  });

  it('PATCH /api/v1/products/:id — Seller non-owner cannot update product (403)', async () => {
    const payload = {
      name: 'Attempt to Hack',
    };

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/products/${createdProductId}`,
      headers: { authorization: `Bearer ${otherSellerToken}` },
      payload,
    });

    expect(res.statusCode).toBe(403);
    const body = JSON.parse(res.body);
    expect(body.message).toBe(PRODUCT_NOT_OWNER);
  });

  // ─── POST /api/v1/products/:id/images — Add Images ──────────────────────
  it('POST /api/v1/products/:id/images — Seller owner can add images', async () => {
    const payload = {
      filePaths: ['temp/mock-file.jpg'],
    };

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/products/${createdProductId}/images`,
      headers: { authorization: `Bearer ${sellerToken}` },
      payload,
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.data.images.length).toBeGreaterThan(0);
  });

  // ─── DELETE /api/v1/products/:id — Soft Delete Product ───────────────────
  it('DELETE /api/v1/products/:id — Seller owner can delete product', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/products/${createdProductId}`,
      headers: { authorization: `Bearer ${sellerToken}` },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.isActive).toBe(false);
  });
});
