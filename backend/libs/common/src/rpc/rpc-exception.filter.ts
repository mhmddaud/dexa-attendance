import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { throwError } from 'rxjs';
import { toRpcError } from './rpc-error.util';

/**
 * Microservice exception filter.
 *
 * Catches any exception thrown inside a microservice message handler and
 * converts it into a serializable RpcErrorShape, which is sent back to the
 * API Gateway over TCP. The gateway then re-maps it to the correct HTTP status.
 */
@Catch()
export class RpcAllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, _host: ArgumentsHost) {
    return throwError(() => toRpcError(exception));
  }
}
