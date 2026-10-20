import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

const DEFAULT_BASE_URL = 'https://pokeapi.co/api/v2';
const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));

config({ path: join(projectRoot, '.env'), quiet: true });

const rawBaseUrl = (process.env['POKEAPI_URL'] ?? '').trim() || DEFAULT_BASE_URL;
const baseUrl = rawBaseUrl.replace(/\/+$/, '');

try {
  const parsed = new URL(baseUrl);

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('POKEAPI_URL must use http or https');
  }
} catch (error) {
  console.error(`Invalid POKEAPI_URL: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

const targetDirectory = join(projectRoot, 'src', 'environments');
const targetFile = join(targetDirectory, 'environment.local.ts');
const content = `import { Environment } from '../app/core/config/environment.model';

export const environment: Environment = {
  pokeapiBaseUrl: ${JSON.stringify(baseUrl)},
};
`;

mkdirSync(targetDirectory, { recursive: true });
writeFileSync(targetFile, content, 'utf8');

console.log(`Generated src/environments/environment.local.ts with ${baseUrl}`);
