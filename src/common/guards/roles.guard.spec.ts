import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForbiddenException, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { RolesGuard } from './roles.guard.js';
import { ROLES_KEY } from '@/common/decorators/roles.decorator.js';

describe('RolesGuard', () => {
    let guard: RolesGuard;
    let reflector: Reflector;

    beforeEach(() => {
        reflector = new Reflector();
        guard = new RolesGuard(reflector);
    });

    function createMockContext(user?: { role: string }) {
        return {
            getHandler: vi.fn().mockReturnValue({}),
            getClass: vi.fn().mockReturnValue({}),
            switchToHttp: vi.fn().mockReturnValue({
                getRequest: vi.fn().mockReturnValue({ user }),
            }),
        // Assert the mock object as ExecutionContext to test the guard logic in isolation
        } as unknown as ExecutionContext;
    }

    it('allows access if no roles are required', () => {
        vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

        const mockContext = createMockContext({ role: 'CUSTOMER' });

        expect(guard.canActivate(mockContext)).toBe(true);
    });

    it('allows access if user has the required role', () => {
        vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);

        const mockContext = createMockContext({ role: 'ADMIN' });

        expect(guard.canActivate(mockContext)).toBe(true);
    });

    it('throws ForbiddenException if user does not have the required role', () => {
        vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);

        const mockContext = createMockContext({ role: 'CUSTOMER' });

        expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
    });

    it('throws ForbiddenException if no user on request', () => {
        vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);

        const mockContext = createMockContext(undefined);

        expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
    });

    it('reads roles metadata via reflector', () => {
        const spy = vi.spyOn(reflector, 'getAllAndOverride');

        const mockContext = createMockContext({ role: 'CUSTOMER' });

        guard.canActivate(mockContext);

        expect(spy).toHaveBeenCalledWith(ROLES_KEY, [
            mockContext.getHandler(),
            mockContext.getClass(),
        ]);
    });
});
