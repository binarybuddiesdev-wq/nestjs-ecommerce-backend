import { describe, it, expect } from 'vitest';
import { validate } from 'class-validator';

import { RegisterDto } from './register.dto.js';

describe('RegisterDto', () => {
    it('passes validation with correct data', async () => {
        const dto = new RegisterDto();
        dto.email = 'test@example.com';
        dto.password = 'StrongPass1!';

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('fails validation when email is empty', async () => {
        const dto = new RegisterDto();
        dto.email = '';
        dto.password = 'StrongPass1!';

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
    });

    it('fails validation when email is not valid', async () => {
        const dto = new RegisterDto();
        dto.email = 'not-an-email';
        dto.password = 'StrongPass1!';

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
    });

    it('fails validation when password is too short', async () => {
        const dto = new RegisterDto();
        dto.email = 'test@example.com';
        dto.password = '123';

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
    });
});
