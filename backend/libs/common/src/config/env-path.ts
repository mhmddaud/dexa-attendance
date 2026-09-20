import { existsSync } from 'fs';
import { join, resolve } from 'path';

/**
 * Resolve candidate .env file locations so services load configuration
 * regardless of the current working directory (running from the repo root,
 * the backend folder, or a Docker workdir).
 *
 * Returns an ordered list of existing .env paths for ConfigModule.forRoot's
 * `envFilePath`. If none are found, ConfigModule falls back to process.env.
 */
export function resolveEnvFilePaths(): string[] {
  const cwd = process.cwd();
  const candidates = [
    join(cwd, '.env'),
    resolve(cwd, '..', '.env'),
    resolve(cwd, '..', '..', '.env'),
    // When launched from dist, walk up to the backend root.
    resolve(__dirname, '..', '..', '..', '..', '.env'),
    resolve(__dirname, '..', '..', '..', '.env'),
  ];
  return candidates.filter((p) => existsSync(p));
}
