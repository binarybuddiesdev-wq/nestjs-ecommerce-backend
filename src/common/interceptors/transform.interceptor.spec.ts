import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import type { ExecutionContext, CallHandler } from '@nestjs/common';

import { TransformInterceptor } from './transform.interceptor.js';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<unknown>;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;

  beforeEach(() => {
    interceptor = new TransformInterceptor();
    mockExecutionContext = {} as ExecutionContext;
    mockCallHandler = {
      handle: vi.fn(),
    };
  });

  it('wraps response in { success: true, message, data }', async () => {
    const responseData = { id: 1, name: 'test' };
    mockCallHandler.handle = vi.fn().mockReturnValue(of(responseData));

    const result = await new Promise<any>((resolve) => {
      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe(resolve);
    });

    expect(result).toEqual({
      success: true,
      message: 'Success',
      data: { id: 1, name: 'test' },
    });
  });

  it('uses data.message if present', async () => {
    const responseData = { message: 'Custom message', data: { id: 1 } };
    mockCallHandler.handle = vi.fn().mockReturnValue(of(responseData));

    const result = await new Promise<any>((resolve) => {
      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe(resolve);
    });

    expect(result).toEqual({
      success: true,
      message: 'Custom message',
      data: { id: 1 },
    });
  });

  it('falls back to Success if no message', async () => {
    const responseData = { data: { id: 1 } };
    mockCallHandler.handle = vi.fn().mockReturnValue(of(responseData));

    const result = await new Promise<any>((resolve) => {
      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe(resolve);
    });

    expect(result.message).toBe('Success');
  });

  it('extracts data.data if present', async () => {
    const innerData = { id: 1, name: 'test' };
    const responseData = { message: 'OK', data: innerData };
    mockCallHandler.handle = vi.fn().mockReturnValue(of(responseData));

    const result = await new Promise<any>((resolve) => {
      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe(resolve);
    });

    expect(result.data).toBe(innerData);
  });

  it('returns raw data if no data.data property', async () => {
    const rawData = { id: 1, name: 'test' };
    mockCallHandler.handle = vi.fn().mockReturnValue(of(rawData));

    const result = await new Promise<any>((resolve) => {
      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe(resolve);
    });

    expect(result.data).toEqual(rawData);
  });
});
