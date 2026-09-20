import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Serializable shape used to carry HTTP-like errors across the TCP transport.
 */
export interface RpcErrorShape {
  isRpcError: true;
  statusCode: number;
  message: string | string[];
  error: string;
}

/**
 * Convert a thrown error (typically an HttpException in a microservice)
 * into a plain, serializable object that survives TCP transport.
 */
export function toRpcError(exception: unknown): RpcErrorShape {
  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    const response = exception.getResponse();
    let message: string | string[];
    let error: string;

    if (typeof response === 'string') {
      message = response;
      error = HttpStatus[status] ?? 'Error';
    } else {
      const res = response as {
        message?: string | string[];
        error?: string;
      };
      message = res.message ?? exception.message;
      error = res.error ?? (HttpStatus[status] ?? 'Error');
    }

    return { isRpcError: true, statusCode: status, message, error };
  }

  return {
    isRpcError: true,
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    message: 'Internal server error',
    error: 'Internal Server Error',
  };
}

/**
 * Type guard for the serialized RPC error shape received at the gateway.
 */
export function isRpcErrorShape(value: unknown): value is RpcErrorShape {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as RpcErrorShape).isRpcError === true &&
    typeof (value as RpcErrorShape).statusCode === 'number'
  );
}

/**
 * Rebuild an HttpException at the gateway from a serialized RPC error.
 */
export function rpcErrorToHttpException(shape: RpcErrorShape): HttpException {
  return new HttpException(
    { statusCode: shape.statusCode, message: shape.message, error: shape.error },
    shape.statusCode,
  );
}
