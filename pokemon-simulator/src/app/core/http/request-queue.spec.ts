import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import {
  HTTP_REQUEST_QUEUE_CONFIG,
  httpRequestQueueInterceptor,
  RequestQueueConfig,
} from './request-queue';

const DEFAULT_CONFIG: RequestQueueConfig = {
  maxConcurrency: 4,
  maxRetries: 0,
  baseDelayMs: 1,
};

function setup(config: Partial<RequestQueueConfig> = {}): {
  http: HttpClient;
  controller: HttpTestingController;
} {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(withInterceptors([httpRequestQueueInterceptor])),
      provideHttpClientTesting(),
      {
        provide: HTTP_REQUEST_QUEUE_CONFIG,
        useValue: { ...DEFAULT_CONFIG, ...config },
      },
    ],
  });

  return {
    http: TestBed.inject(HttpClient),
    controller: TestBed.inject(HttpTestingController),
  };
}

describe('httpRequestQueueInterceptor', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it('deduplicates simultaneous requests to the same URL', async () => {
    const { http, controller } = setup();

    const first = firstValueFrom(http.get('/api/same'));
    const second = firstValueFrom(http.get('/api/same'));

    controller.expectOne('/api/same').flush({ ok: true });

    await expect(first).resolves.toEqual({ ok: true });
    await expect(second).resolves.toEqual({ ok: true });
  });

  it('respects the configured concurrency limit', async () => {
    const { http, controller } = setup({ maxConcurrency: 2 });

    const first = firstValueFrom(http.get('/api/1'));
    const second = firstValueFrom(http.get('/api/2'));
    const third = firstValueFrom(http.get('/api/3'));

    const open = controller.match(() => true);
    expect(open).toHaveLength(2);

    open[0].flush({ ok: 1 });
    const next = controller.expectOne('/api/3');
    open[1].flush({ ok: 2 });
    next.flush({ ok: 3 });

    await expect(first).resolves.toEqual({ ok: 1 });
    await expect(second).resolves.toEqual({ ok: 2 });
    await expect(third).resolves.toEqual({ ok: 3 });
  });

  it('retries rate-limited requests with exponential backoff', async () => {
    const { http, controller } = setup({ maxRetries: 1, baseDelayMs: 1 });

    const result = firstValueFrom(http.get('/api/limited'));

    controller
      .expectOne('/api/limited')
      .flush(null, { status: 429, statusText: 'Too Many Requests' });

    await new Promise((resolve) => setTimeout(resolve, 10));

    controller.expectOne('/api/limited').flush({ ok: true });

    await expect(result).resolves.toEqual({ ok: true });
  });

  it('does not retry client errors other than 429', async () => {
    const { http, controller } = setup({ maxRetries: 3 });

    const result = firstValueFrom(http.get('/api/missing'));

    controller.expectOne('/api/missing').flush(null, { status: 404, statusText: 'Not Found' });

    await expect(result).rejects.toBeTruthy();
  });
});
