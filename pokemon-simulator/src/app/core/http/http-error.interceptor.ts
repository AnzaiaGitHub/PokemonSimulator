import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { NetworkError, NotFoundError, RateLimitError } from '../errors/data-error';

export const httpErrorInterceptor: HttpInterceptorFn = (request, next) =>
  next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        return throwError(() => toDataError(error));
      }

      return throwError(() => error);
    }),
  );

function toDataError(error: HttpErrorResponse): Error {
  if (error.status === 404) {
    return new NotFoundError(`Resource not found: ${error.url ?? 'unknown resource'}`);
  }

  if (error.status === 429) {
    return new RateLimitError('PokéAPI rate limit reached');
  }

  return new NetworkError(`Request failed with status ${error.status}`);
}
