import { describe, it, expect } from 'vitest';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants.js';

import { CurrentUser } from './current-user.decorator.js';
import type { IUserPayload } from '@/types/index.js';

describe('@CurrentUser decorator', () => {
    function getFactory(data: keyof IUserPayload | undefined) {
        class Test {
            test(@CurrentUser(data) _param: unknown) { }
        }
        const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, Test, 'test');
        // Assert the returned decorator factory metadata as a wrapper containing the factory function
        const paramMeta = Object.values(metadata)[0] as { factory: (data: unknown, ctx: unknown) => unknown };
        return paramMeta.factory;
    }

    function mockExecutionContext(user: unknown) {
        return {
            switchToHttp: () => ({
                getRequest: () => ({ user }),
            }),
        };
    }

    it('extracts the full user object when no data key is given', () => {
        const factory = getFactory(undefined);
        const mockUser = { id: '1', email: 'test@example.com', role: 'CUSTOMER' };

        const result = factory(undefined, mockExecutionContext(mockUser));

        expect(result).toEqual(mockUser);
    });

    it('extracts a specific property from user when data key is given', () => {
        const factory = getFactory('id');
        const mockUser = { id: '1', email: 'test@example.com', role: 'CUSTOMER' };

        const result = factory('id', mockExecutionContext(mockUser));

        expect(result).toBe('1');
    });

    it('returns undefined if no user on request', () => {
        const factory = getFactory(undefined);

        const result = factory(undefined, mockExecutionContext(undefined));

        expect(result).toBeUndefined();
    });
});
