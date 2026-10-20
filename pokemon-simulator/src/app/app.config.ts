import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { httpErrorInterceptor } from './core/http/http-error.interceptor';
import { providePokedexLocal } from './features/pokedex/data-access/pokedex-local.config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withFetch(), withInterceptors([httpErrorInterceptor])),
    provideRouter(routes, withComponentInputBinding()),
    providePokedexLocal(),
  ],
};
