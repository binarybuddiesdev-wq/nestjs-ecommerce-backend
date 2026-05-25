import { describe, it, expect } from 'vitest';

import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  it('GET /health returns { status: ok }', () => {
    const controller = new HealthController();
    const result = controller.healthCheck();

    expect(result).toEqual({ status: 'ok' });
  });
});
