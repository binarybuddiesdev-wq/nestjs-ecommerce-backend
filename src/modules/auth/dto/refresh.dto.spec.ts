import { describe, it, expect } from 'vitest';
import { validate } from 'class-validator';

import { RefreshDto } from './refresh.dto.js';

describe('RefreshDto', () => {
    it('passes validation with a token', async () => {
        const dto = new RefreshDto();
        dto.refreshToken = 'some-token-value';

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('fails validation when token is empty', async () => {
        const dto = new RefreshDto();
        dto.refreshToken = '';

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
    });
});
