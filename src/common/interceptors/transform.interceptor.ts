import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';

export interface IResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, IResponse<T>> {

    intercept(context: ExecutionContext, next: CallHandler): Observable<IResponse<T>> {
        return next.handle().pipe(map(data => ({
            success: true,
            message: data?.message || 'Success',
            data: data?.data !== undefined ? data.data : data,
        })));
    };

};