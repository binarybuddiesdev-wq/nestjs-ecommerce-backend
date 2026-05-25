import { FastifyReply, FastifyRequest } from 'fastify';
import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger
} from '@nestjs/common';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {

    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {

        const ctx = host.switchToHttp();
        const reply = ctx.getResponse<FastifyReply>();
        const request = ctx.getRequest<FastifyRequest>();

        const status = exception instanceof HttpException
            ? exception.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;

        const exceptionResponse = exception instanceof HttpException
            ? exception.getResponse()
            : 'Internal server error';

        const message = this.extractMessage(exception, exceptionResponse);

        if (status >= 500) {
            this.logger.error(
                `HTTP ${status} Error`,
                exception instanceof Error ? exception.stack : JSON.stringify(exception),
                `${request.method} ${request.url}`
            );
        } else {
            this.logger.warn(
                `HTTP ${status} Warning: ${message}`,
                `${request.method} ${request.url}`
            );
        }

        reply.status(status).send({
            success: false,
            message,
            statusCode: status,
            path: request.url,
            timestamp: new Date().toISOString(),
        });
    }

    private extractMessage(exception: unknown, exceptionResponse: unknown): string {
        if (!exceptionResponse) {
            return 'Internal server error';
        }

        if (typeof exceptionResponse === 'object' && exceptionResponse !== null && 'message' in exceptionResponse) {

            // Assert shape as object containing message to safely extract validation error messages
            const message = (exceptionResponse as { message: unknown }).message;

            if (Array.isArray(message)) {
                return message.join(', ');
            }

            if (typeof message === 'string') {
                return message;
            }
        }

        if (exception instanceof HttpException) {
            return exception.message;
        }

        return 'Internal server error';
    }
}