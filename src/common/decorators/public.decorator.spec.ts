import { describe, it, expect } from 'vitest';
import { Reflector } from '@nestjs/core';

import { Public, IS_PUBLIC_KEY } from './public.decorator.js';

describe('@Public decorator', () => {
    it('sets isPublic metadata to true', () => {
        const reflector = new Reflector();

        class TestController {
            @Public()
            testMethod() { }
        }

        const metadata = reflector.get(IS_PUBLIC_KEY, TestController.prototype.testMethod);
        expect(metadata).toBe(true);
    });
});
