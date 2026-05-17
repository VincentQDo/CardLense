import { getRequestEvent } from '$app/server';
import { betterAuth } from 'better-auth';
import { getMigrations } from 'better-auth/db/migration';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import Database from 'better-sqlite3';

import { databasePath, ensureDatabaseDirectory } from '$lib/server/database';

const requireEmailVerification = process.env.BETTER_AUTH_REQUIRE_EMAIL_VERIFICATION === 'true';

ensureDatabaseDirectory();

export const auth = betterAuth({
  database: new Database(databasePath),
  secret: process.env.BETTER_AUTH_SECRET ?? 'cardlense-local-development-secret',
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:5173',
  emailAndPassword: {
    enabled: true,
    requireEmailVerification
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      console.warn(`Email verification requested for ${user.email}: ${url}`);
    }
  },
  plugins: [sveltekitCookies(getRequestEvent)]
});

export const authReady = getMigrations(auth.options).then((migrations) =>
  migrations.runMigrations()
);
