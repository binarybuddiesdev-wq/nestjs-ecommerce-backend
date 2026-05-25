import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ConfigModule } from '@nestjs/config';
import type { FastifyInstance } from 'fastify';

import { LoggerModule } from 'nestjs-pino';

import { HealthModule } from '@/modules/health/health.module.js';
import { GlobalExceptionFilter } from '@/common/filters/http-exception.filter.js';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = '';

describe('Health E2E', () => {
  let app: NestFastifyApplication;
  let fastifyInstance: FastifyInstance;

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
            }),
          ],
        }),
        LoggerModule.forRoot({
          pinoHttp: {
            level: 'silent',
          },
        }),
        HealthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );

    app.useGlobalFilters(new GlobalExceptionFilter());
    app.setGlobalPrefix('api/v1', { exclude: ['health'] });

    await app.init();
    fastifyInstance = app.getHttpAdapter().getInstance() as unknown as FastifyInstance;
    await fastifyInstance.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns 200 with { status: ok }', async () => {
    const response = await fastifyInstance.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.payload)).toEqual({ status: 'ok' });
  });

  it('GET /api/v1/nonexistent returns 404 with error shape', async () => {
    const response = await fastifyInstance.inject({
      method: 'GET',
      url: '/api/v1/nonexistent',
    });

    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.payload);
    expect(body).toHaveProperty('success', false);
    expect(body).toHaveProperty('message');
    expect(body).toHaveProperty('statusCode', 404);
    expect(body).toHaveProperty('path');
    expect(body).toHaveProperty('timestamp');
  });
});
