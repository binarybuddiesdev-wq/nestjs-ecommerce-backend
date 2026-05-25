import { describe, it, expect } from 'vitest';

import { successResponseSchema } from './api.constants.js';

describe('successResponseSchema', () => {
  it('returns schema with success, message, and data properties', () => {
    const dataSchema = { type: 'object', properties: { id: { type: 'number' } } };
    const result = successResponseSchema(dataSchema, 'Products retrieved successfully');

    expect(result).toEqual({
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Products retrieved successfully' },
          data: dataSchema,
        },
      },
    });
  });
});
