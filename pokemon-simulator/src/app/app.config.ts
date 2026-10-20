import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { httpErrorInterceptor } from './core/http/http-error.interceptor';
import { httpRequestQueueInterceptor } from './core/http/request-queue';
import { TeamStore } from './features/team/stores/team.store';
import { providePokedexLocal } from './features/pokedex/data-access/pokedex-local.config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(
      withFetch(),
      withInterceptors([httpRequestQueueInterceptor, httpErrorInterceptor]),
    ),
    provideRouter(routes, withComponentInputBinding()),
    providePokedexLocal(),
    provideAppInitializer(() => inject(TeamStore).load()),
  ],
};
