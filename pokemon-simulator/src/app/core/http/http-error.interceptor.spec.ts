import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { NetworkError, NotFoundError, RateLimitError } from '../errors/data-error';
import { httpErrorInterceptor } from './http-error.interceptor';

describe('httpErrorInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([httpErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('translates 404 responses to NotFoundError', async () => {
    const request = firstValueFrom(http.get('/api/missing'));
    controller.expectOne('/api/missing').flush(null, { status: 404, statusText: 'Not Found' });

    await expect(request).rejects.toBeInstanceOf(NotFoundError);
  });

  it('translates 429 responses to RateLimitError', async () => {
    const request = firstValueFrom(http.get('/api/limited'));
    controller
      .expectOne('/api/limited')
      .flush(null, { status: 429, statusText: 'Too Many Requests' });

    await expect(request).rejects.toBeInstanceOf(RateLimitError);
  });

  it('translates network failures and 5xx responses to NetworkError', async () => {
    const offline = firstValueFrom(http.get('/api/offline'));
    controller.expectOne('/api/offline').error(new ProgressEvent('error'));

    const serverError = firstValueFrom(http.get('/api/server'));
    controller.expectOne('/api/server').flush(null, { status: 503, statusText: 'Unavailable' });

    await expect(offline).rejects.toBeInstanceOf(NetworkError);
    await expect(serverError).rejects.toBeInstanceOf(NetworkError);
  });
});
