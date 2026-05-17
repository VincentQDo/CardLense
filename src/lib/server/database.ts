import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

export const databasePath = join(process.cwd(), 'data', 'cardlense.sqlite');

export function ensureDatabaseDirectory(): void {
  mkdirSync(dirname(databasePath), { recursive: true });
}
