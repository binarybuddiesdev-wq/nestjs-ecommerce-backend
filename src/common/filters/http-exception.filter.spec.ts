import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpException, HttpStatus } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { GlobalExceptionFilter } from './http-exception.filter.js';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockReply: Partial<FastifyReply>;
  let mockRequest: Partial<FastifyRequest>;
  let mockHost: ArgumentsHost;
  let mockLogger: { error: ReturnType<typeof vi.fn>; warn: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    mockLogger = {
      error: vi.fn(),
      warn: vi.fn(),
    };

    mockReply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };

    mockRequest = {
      url: '/api/v1/test',
      method: 'GET',
    };

    mockHost = {
      switchToHttp: vi.fn().mockReturnThis() as unknown as ArgumentsHost['switchToHttp'],
      getResponse: vi.fn().mockReturnValue(mockReply),
      getRequest: vi.fn().mockReturnValue(mockRequest),
    } as unknown as ArgumentsHost;

    filter = new GlobalExceptionFilter();
    (filter as unknown as { logger: typeof mockLogger }).logger = mockLogger;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('HttpException returns correct error shape', () => {
    const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);

    filter.catch(exception, mockHost);

    const sent = (mockReply.send as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(sent).toMatchObject({
      success: false,
      message: 'Not Found',
      statusCode: 404,
      path: '/api/v1/test',
    });
    expect(sent).toHaveProperty('timestamp');
  });

  it('unknown error returns 500 with Internal server error message', () => {
    const exception = new Error('Something broke');

    filter.catch(exception, mockHost);

    const sent = (mockReply.send as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(sent).toMatchObject({
      success: false,
      message: 'Internal server error',
      statusCode: 500,
      path: '/api/v1/test',
    });
    expect(sent).toHaveProperty('timestamp');
  });

  it('validation error with array message joins correctly', () => {
    const exception = new HttpException(
      {
        statusCode: 400,
        message: ['name must be a string', 'price must be positive'],
        error: 'Bad Request',
      },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, mockHost);

    const sent = (mockReply.send as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(sent.message).toBe('name must be a string, price must be positive');
    expect(sent.statusCode).toBe(400);
  });

  it('5xx errors are logged as error', () => {
    const exception = new HttpException('Internal Error', HttpStatus.INTERNAL_SERVER_ERROR);

    filter.catch(exception, mockHost);

    expect(mockLogger.error).toHaveBeenCalled();
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('4xx errors are logged as warn', () => {
    const exception = new HttpException('Bad Request', HttpStatus.BAD_REQUEST);

    filter.catch(exception, mockHost);

    expect(mockLogger.warn).toHaveBeenCalled();
    expect(mockLogger.error).not.toHaveBeenCalled();
  });

  it('HttpException with falsy exception response returns Internal server error', () => {
    const exception = new HttpException('', HttpStatus.NOT_FOUND);

    filter.catch(exception, mockHost);

    const sent = (mockReply.send as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(sent.message).toBe('Internal server error');
  });

  it('HttpException with object response containing string message extracts message', () => {
    const exception = new HttpException(
      { message: 'Email already in use', error: 'Conflict' },
      HttpStatus.CONFLICT,
    );

    filter.catch(exception, mockHost);

    const sent = (mockReply.send as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(sent.message).toBe('Email already in use');
  });
});
