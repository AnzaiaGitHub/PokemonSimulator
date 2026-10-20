import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment.local';

export const POKEAPI_BASE_URL = new InjectionToken<string>('PokeapiBaseUrl', {
  providedIn: 'root',
  factory: () => environment.pokeapiBaseUrl,
});
