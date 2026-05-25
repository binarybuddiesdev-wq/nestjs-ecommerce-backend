import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('generated/prisma/client.js', () => {
  class MockPrismaClient {
    $connect = vi.fn();
    $disconnect = vi.fn();
  }

  return { PrismaClient: MockPrismaClient };
});

import { PrismaService } from './prisma.service.js';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(() => {
    service = new PrismaService();
  });

  it('onModuleInit calls $connect', async () => {
    const spy = vi.spyOn(service, '$connect').mockResolvedValue();

    await service.onModuleInit();

    expect(spy).toHaveBeenCalledOnce();
  });

  it('onModuleDestroy calls $disconnect', async () => {
    const spy = vi.spyOn(service, '$disconnect').mockResolvedValue();

    await service.onModuleDestroy();

    expect(spy).toHaveBeenCalledOnce();
  });
});
