import { Injectable, NestMiddleware } from '@nestjs/common';
import { IncomingMessage, ServerResponse } from 'node:http';

@Injectable()
export class SanitizeMiddleware implements NestMiddleware {

    use(req: IncomingMessage & { body?: any }, res: ServerResponse, next: () => void) {
        if (req.body && typeof req.body === 'object') {
            Object.keys(req.body).forEach((key) => {
                if (typeof req.body[key] === 'string') {
                    req.body[key] = req.body[key].trim();
                }
            });
        }
        next();
    }

};