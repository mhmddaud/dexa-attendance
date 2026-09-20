import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import { map, Observable } from 'rxjs';

/** Uniform success envelope returned for every endpoint. */
export interface ApiResponse<T> {
  success: true;
  statusCode: number;
  message: string;
  data: T;
}

/**
 * Wraps every successful HTTP response in a consistent envelope:
 *   { success: true, statusCode, message, data }
 *
 * The original controller/service return value is placed under `data`.
 */
@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const response = context.switchToHttp().getResponse<Response>();
    return next.handle().pipe(
      map((data: T) => ({
        success: true,
        statusCode: response.statusCode,
        message: 'OK',
        data,
      })),
    );
  }
}
