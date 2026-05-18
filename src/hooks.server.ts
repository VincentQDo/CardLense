import { building } from '$app/environment';
import { svelteKitHandler } from 'better-auth/svelte-kit';

import { auth, authReady } from '$lib/server/auth';
import { logError, logInfo } from '$lib/server/logger';

import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const startedAt = performance.now();
  const pathname = event.url.pathname;

  await authReady;

  const session = await auth.api.getSession({
    headers: event.request.headers
  });

  if (session) {
    event.locals.session = session.session;
    event.locals.user = session.user;
  }

  try {
    const response = await svelteKitHandler({ auth, event, resolve, building });

    logRequest(event, response.status, startedAt);

    return response;
  } catch (error) {
    logError('request_failed', error, {
      method: event.request.method,
      path: pathname,
      userId: event.locals.user?.id
    });
    throw error;
  }
};

function logRequest(
  event: Parameters<Handle>[0]['event'],
  status: number,
  startedAt: number
): void {
  if (isNoisyAssetPath(event.url.pathname)) {
    return;
  }

  logInfo('request_completed', {
    durationMs: Math.round(performance.now() - startedAt),
    method: event.request.method,
    path: event.url.pathname,
    status,
    userId: event.locals.user?.id
  });
}

function isNoisyAssetPath(pathname: string): boolean {
  return (
    pathname.startsWith('/@') ||
    pathname.startsWith('/node_modules') ||
    pathname.startsWith('/.well-known') ||
    pathname.includes('/immutable/')
  );
}
