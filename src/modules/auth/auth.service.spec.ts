import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service.js';
import { PrismaService } from '@/prisma/prisma.service.js';
import { PinoLogger } from 'nestjs-pino';

vi.mock('bcrypt', () => ({
    default: {
        genSalt: vi.fn().mockResolvedValue('salt'),
        hash: vi.fn().mockResolvedValue('hashed-password'),
        compare: vi.fn(),
    },
    genSalt: vi.fn().mockResolvedValue('salt'),
    hash: vi.fn().mockResolvedValue('hashed-password'),
    compare: vi.fn(),
}));

import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
    let service: AuthService;
    let prisma: PrismaService;
    let jwtService: JwtService;
    let logger: PinoLogger;

    const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashed-password',
        name: 'Test User',
        avatar: null,
        role: 'CUSTOMER',
        isActive: true,
        address: [],
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockRefreshToken = {
        id: 'rt-1',
        token: 'refresh-token-value',
        userId: 'user-1',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isRevoked: false,
        createdAt: new Date(),
    };

    let configService: ConfigService;

    beforeEach(() => {
        // Assert the mock pino logger object to satisfy AuthService dependencies
        logger = {
            info: vi.fn(),
            debug: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
        } as unknown as PinoLogger;

        // Assert the mock prisma client object to satisfy AuthService dependencies
        prisma = {
            user: {
                findUnique: vi.fn(),
                create: vi.fn(),
            },
            refreshToken: {
                findUnique: vi.fn(),
                create: vi.fn(),
                update: vi.fn(),
                updateMany: vi.fn(),
            },
        } as unknown as PrismaService;

        // Assert mock jwt object to satisfy AuthService dependencies
        jwtService = {
            sign: vi.fn().mockReturnValue('access-token'),
        } as unknown as JwtService;

        // Assert mock config object to satisfy AuthService dependencies
        configService = {
            get: vi.fn().mockReturnValue(604800000),
        } as unknown as ConfigService;

        service = new AuthService(logger, prisma, jwtService, configService);
    });

    describe('register', () => {
        it('creates a user and returns without password', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
            vi.mocked(prisma.user.create).mockResolvedValue(mockUser);

            const result = await service.register({ email: 'test@example.com', password: 'password123', name: 'Test User' });

            expect(result).not.toHaveProperty('password');
            expect(result.email).toBe('test@example.com');
            expect(result.name).toBe('Test User');
        });

        it('throws ConflictException if email already exists', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

            await expect(
                service.register({ email: 'test@example.com', password: 'password123', name: 'Test User' }),
            ).rejects.toThrow(ConflictException);
        });
    });

    describe('login', () => {
        it('returns user and tokens for valid credentials', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
            // Cast bcrypt.compare mock to the Promise-returning overload signature to satisfy TypeScript
            vi.mocked(bcrypt.compare as (data: string | Buffer, encrypted: string) => Promise<boolean>).mockResolvedValue(true);
            vi.mocked(prisma.refreshToken.create).mockResolvedValue(mockRefreshToken);

            const result = await service.login({ email: 'test@example.com', password: 'password123' });

            expect(result).toHaveProperty('accessToken');
            expect(result).toHaveProperty('refreshToken');
            expect(result.user).not.toHaveProperty('password');
        });

        it('throws UnauthorizedException if user not found', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

            await expect(
                service.login({ email: 'wrong@example.com', password: 'password123' }),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('throws UnauthorizedException if password is wrong', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
            // Cast bcrypt.compare mock to the Promise-returning overload signature to satisfy TypeScript
            vi.mocked(bcrypt.compare as (data: string | Buffer, encrypted: string) => Promise<boolean>).mockResolvedValue(false);

            await expect(
                service.login({ email: 'test@example.com', password: 'wrong-password' }),
            ).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('me', () => {
        it('returns user without password', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

            const result = await service.me('user-1');

            expect(result).not.toHaveProperty('password');
            expect(result.email).toBe('test@example.com');
        });

        it('throws NotFoundException if user not found', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

            await expect(service.me('nonexistent')).rejects.toThrow(NotFoundException);
        });
    });

    describe('refresh', () => {
        it('rotates tokens when given a valid refresh token', async () => {
            vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue(mockRefreshToken);
            vi.mocked(prisma.refreshToken.update).mockResolvedValue({ ...mockRefreshToken, isRevoked: true });
            vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
            vi.mocked(prisma.refreshToken.create).mockResolvedValue({ ...mockRefreshToken, token: 'new-refresh-token' });

            const result = await service.refresh({ refreshToken: 'refresh-token-value' });

            expect(result).toHaveProperty('accessToken');
            expect(result).toHaveProperty('refreshToken');
            expect(prisma.refreshToken.update).toHaveBeenCalledWith(
                expect.objectContaining({ where: { id: 'rt-1' }, data: { isRevoked: true } }),
            );
        });

        it('throws UnauthorizedException if refresh token is revoked', async () => {
            vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue({ ...mockRefreshToken, isRevoked: true });

            await expect(
                service.refresh({ refreshToken: 'revoked-token' }),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('throws UnauthorizedException if refresh token is expired', async () => {
            vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue({ ...mockRefreshToken, expiresAt: new Date(Date.now() - 1000) });

            await expect(
                service.refresh({ refreshToken: 'expired-token' }),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('throws UnauthorizedException if refresh token not found', async () => {
            vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue(null);

            await expect(
                service.refresh({ refreshToken: 'nonexistent' }),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('throws UnauthorizedException if user no longer exists', async () => {
            vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue(mockRefreshToken);
            vi.mocked(prisma.refreshToken.update).mockResolvedValue({ ...mockRefreshToken, isRevoked: true });
            vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

            await expect(
                service.refresh({ refreshToken: 'orphaned-token' }),
            ).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('logout', () => {
        it('revokes all active refresh tokens for the user', async () => {
            vi.mocked(prisma.refreshToken.updateMany).mockResolvedValue({ count: 2 });

            await service.logout('user-1');

            expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
                where: { userId: 'user-1', isRevoked: false },
                data: { isRevoked: true },
            });
        });
    });

    describe('constructor fallback', () => {
        it('uses default expiry when config returns undefined', () => {
            vi.mocked(configService.get).mockReturnValue(undefined);

            const s = new AuthService(logger, prisma, jwtService, configService);

            expect(s).toBeInstanceOf(AuthService);
        });
    });
});
