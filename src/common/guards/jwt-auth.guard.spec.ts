import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';

import { JwtAuthGuard } from './jwt-auth.guard.js';
import { IS_PUBLIC_KEY } from '@/common/decorators/public.decorator.js';

describe('JwtAuthGuard', () => {
    let guard: JwtAuthGuard;
    let reflector: Reflector;

    const mockContext = (overrides = {}) => ({
        getHandler: vi.fn(),
        getClass: vi.fn(),
        switchToHttp: vi.fn().mockReturnValue({
            getRequest: vi.fn().mockReturnValue({ headers: {} }),
            getResponse: vi.fn().mockReturnValue({}),
        }),
        ...overrides,
    // Assert the mock object as ExecutionContext to test the guard logic in isolation
    }) as unknown as ExecutionContext;

    beforeEach(() => {
        reflector = new Reflector();
        guard = new JwtAuthGuard(reflector);
    });

    it('returns true when route has @Public() metadata', () => {
        vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

        const context = mockContext();
        const result = guard.canActivate(context);

        expect(result).toBe(true);
    });

    it('reads isPublic metadata via reflector', () => {
        const spy = vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

        const context = mockContext();
        guard.canActivate(context);

        expect(spy).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
    });

    it('throws unauthorized when not public and no valid token', async () => {
        vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

        const context = mockContext();
        const promise = guard.canActivate(context);

        await expect(promise).rejects.toThrow();
    });
});
