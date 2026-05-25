import { describe, it, expect } from 'vitest';
import { validate } from 'class-validator';

import { LoginDto } from './login.dto.js';

describe('LoginDto', () => {
    it('passes validation with correct data', async () => {
        const dto = new LoginDto();
        dto.email = 'test@example.com';
        dto.password = 'mypassword';

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('fails validation when email is empty', async () => {
        const dto = new LoginDto();
        dto.email = '';
        dto.password = 'mypassword';

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
    });

    it('fails validation when password is empty', async () => {
        const dto = new LoginDto();
        dto.email = 'test@example.com';
        dto.password = '';

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
    });
});
