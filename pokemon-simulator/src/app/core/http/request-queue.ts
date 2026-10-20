import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { finalize, Observable, retry, shareReplay, Subscription, throwError, timer } from 'rxjs';

export interface RequestQueueConfig {
  readonly maxConcurrency: number;
  readonly maxRetries: number;
  readonly baseDelayMs: number;
}

export const HTTP_REQUEST_QUEUE_CONFIG = new InjectionToken<RequestQueueConfig>(
  'HttpRequestQueueConfig',
  {
    providedIn: 'root',
    factory: () => ({
      maxConcurrency: 4,
      maxRetries: 3,
      baseDelayMs: 300,
    }),
  },
);

@Injectable({
  providedIn: 'root',
})
export class HttpRequestQueue {
  private readonly config = inject(HTTP_REQUEST_QUEUE_CONFIG);
  private readonly inFlight = new Map<string, Observable<HttpEvent<unknown>>>();
  private readonly waiting: (() => void)[] = [];
  private active = 0;

  handle(request: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
    if (request.method !== 'GET') {
      return this.execute(request, next);
    }

    const key = `${request.method} ${request.urlWithParams} ${request.responseType}`;
    const existing = this.inFlight.get(key);

    if (existing) {
      return existing;
    }

    const shared = this.execute(request, next).pipe(
      finalize(() => this.inFlight.delete(key)),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    this.inFlight.set(key, shared);

    return shared;
  }

  private execute(
    request: HttpRequest<unknown>,
    next: HttpHandlerFn,
  ): Observable<HttpEvent<unknown>> {
    return this.schedule(request, next).pipe(
      retry({
        count: this.config.maxRetries,
        delay: (error: unknown, retryCount: number) => {
          if (!isRetryable(error)) {
            return throwError(() => error);
          }

          return timer(this.config.baseDelayMs * 2 ** (retryCount - 1));
        },
      }),
    );
  }

  private schedule(
    request: HttpRequest<unknown>,
    next: HttpHandlerFn,
  ): Observable<HttpEvent<unknown>> {
    return new Observable<HttpEvent<unknown>>((subscriber) => {
      let subscription: Subscription | undefined;
      let started = false;

      const start = (): void => {
        started = true;
        this.active += 1;
        subscription = next(request)
          .pipe(finalize(() => this.release()))
          .subscribe(subscriber);
      };

      if (this.active < this.config.maxConcurrency) {
        start();
      } else {
        this.waiting.push(start);
      }

      return () => {
        if (!started) {
          const index = this.waiting.indexOf(start);

          if (index >= 0) {
            this.waiting.splice(index, 1);
          }

          return;
        }

        subscription?.unsubscribe();
      };
    });
  }

  private release(): void {
    this.active = Math.max(0, this.active - 1);
    this.waiting.shift()?.();
  }
}

export const httpRequestQueueInterceptor: HttpInterceptorFn = (request, next) =>
  inject(HttpRequestQueue).handle(request, next);

function isRetryable(error: unknown): boolean {
  return error instanceof HttpErrorResponse && (error.status === 429 || error.status >= 500);
}
