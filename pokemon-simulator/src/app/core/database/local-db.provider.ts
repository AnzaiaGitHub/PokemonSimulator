import { inject, InjectionToken, Provider } from '@angular/core';
import { DEFAULT_LOCAL_DB_NAME, AppDatabase } from './local-db.schema';

export const LOCAL_DB_NAME = new InjectionToken<string>('LocalDbName', {
  providedIn: 'root',
  factory: () => DEFAULT_LOCAL_DB_NAME,
});

export const APP_DATABASE = new InjectionToken<AppDatabase>('AppDatabase', {
  providedIn: 'root',
  factory: () => new AppDatabase(inject(LOCAL_DB_NAME)),
});

export function provideLocalDb(name: string = DEFAULT_LOCAL_DB_NAME): Provider[] {
  return [
    {
      provide: LOCAL_DB_NAME,
      useValue: name,
    },
  ];
}
