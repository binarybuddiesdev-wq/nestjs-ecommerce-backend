import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';

import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

describe('AuthController', () => {
    let controller: AuthController;
    let authService: AuthService;

    const mockAuthService = {
        register: vi.fn(),
        login: vi.fn(),
        me: vi.fn(),
        refresh: vi.fn(),
        logout: vi.fn(),
    };

    beforeEach(async () => {
        vi.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({
                    isGlobal: true,
                    load: [() => ({ port: 0, nodeEnv: 'test', databaseUrl: '' })],
                }),
                LoggerModule.forRoot({ pinoHttp: { level: 'silent' } }),
            ],
            controllers: [AuthController],
            providers: [
                { provide: AuthService, useValue: mockAuthService },
            ],
        }).compile();

        controller = module.get<AuthController>(AuthController);
        authService = module.get<AuthService>(AuthService);
    });

    it('register calls service and returns wrapped response', async () => {
        mockAuthService.register.mockResolvedValue({ id: '1', email: 'a@b.com', role: 'CUSTOMER' });

        const result = await controller.register({ email: 'a@b.com', password: 'password123' });

        expect(authService.register).toHaveBeenCalledWith({ email: 'a@b.com', password: 'password123' });
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('data');
    });

    it('login calls service and returns wrapped response with tokens', async () => {
        mockAuthService.login.mockResolvedValue({
            user: { id: '1', email: 'a@b.com', role: 'CUSTOMER' },
            accessToken: 'at',
            refreshToken: 'rt',
        });

        const result = await controller.login({ email: 'a@b.com', password: 'password123' });

        expect(authService.login).toHaveBeenCalled();
        expect(result.data).toHaveProperty('accessToken');
        expect(result.data).toHaveProperty('refreshToken');
    });

    it('me calls service with userId and returns wrapped response', async () => {
        mockAuthService.me.mockResolvedValue({ id: '1', email: 'a@b.com', role: 'CUSTOMER' });

        const result = await controller.me('user-1');

        expect(authService.me).toHaveBeenCalledWith('user-1');
        expect(result).toHaveProperty('data');
    });

    it('refresh calls service and returns wrapped response', async () => {
        mockAuthService.refresh.mockResolvedValue({ accessToken: 'new-at', refreshToken: 'new-rt' });

        const result = await controller.refresh({ refreshToken: 'some-token' });

        expect(authService.refresh).toHaveBeenCalledWith({ refreshToken: 'some-token' });
        expect(result.data).toHaveProperty('accessToken');
        expect(result.data).toHaveProperty('refreshToken');
    });

    it('logout calls service with userId and returns wrapped response', async () => {
        mockAuthService.logout.mockResolvedValue(undefined);

        const result = await controller.logout('user-1');

        expect(authService.logout).toHaveBeenCalledWith('user-1');
        expect(result).toHaveProperty('message');
    });
});
