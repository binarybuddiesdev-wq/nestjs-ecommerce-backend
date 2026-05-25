import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfigService } from '@nestjs/config';

import { JwtStrategy } from './jwt.strategy.js';
import { PrismaService } from '@/prisma/prisma.service.js';

describe('JwtStrategy', () => {
    let strategy: JwtStrategy;
    let prisma: PrismaService;

    beforeEach(() => {
        // Assert the mock object as PrismaService for testing strategy in isolation
        prisma = {
            user: {
                findUnique: vi.fn(),
            },
        } as unknown as PrismaService;

        // Assert the mock config as ConfigService for constructor injection dependency
        const configService = {
            get: vi.fn().mockReturnValue('test-secret'),
        } as unknown as ConfigService;

        strategy = new JwtStrategy(configService, prisma);
    });

    it('returns user payload when user exists', async () => {
        const mockUser = { id: 'user-1', email: 'test@example.com', role: 'ADMIN' };
        // Assert findUnique as a mock function to configure mocked database response
        (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);

        const result = await strategy.validate({ sub: 'user-1', email: 'test@example.com', role: 'ADMIN' });

        expect(result).toEqual({ id: 'user-1', email: 'test@example.com', role: 'ADMIN' });
    });

    it('throws UnauthorizedException when user not found', async () => {
        // Assert findUnique as a mock function to configure mocked database response
        (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

        await expect(
            strategy.validate({ sub: 'nonexistent', email: 'test@example.com', role: 'CUSTOMER' }),
        ).rejects.toThrow();
    });

    it('constructs with fallback secret when config returns undefined', () => {
        // Assert mock config as ConfigService to satisfy dependencies
        const configService = {
            get: vi.fn().mockReturnValue(undefined),
        } as unknown as ConfigService;

        const strat = new JwtStrategy(configService, prisma);

        expect(strat).toBeInstanceOf(JwtStrategy);
    });
});
