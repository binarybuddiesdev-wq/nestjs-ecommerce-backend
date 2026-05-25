import { describe, it, expect } from 'vitest';
import { Reflector } from '@nestjs/core';

import { Roles, ROLES_KEY } from './roles.decorator.js';

describe('@Roles decorator', () => {
    it('sets roles metadata to the provided roles array', () => {
        const reflector = new Reflector();

        class TestController {
            @Roles('ADMIN', 'MODERATOR')
            testMethod() { }
        }

        const metadata = reflector.get(ROLES_KEY, TestController.prototype.testMethod);
        expect(metadata).toEqual(['ADMIN', 'MODERATOR']);
    });

    it('sets a single role when only one is provided', () => {
        const reflector = new Reflector();

        class TestController {
            @Roles('ADMIN')
            testMethod() { }
        }

        const metadata = reflector.get(ROLES_KEY, TestController.prototype.testMethod);
        expect(metadata).toEqual(['ADMIN']);
    });
});
