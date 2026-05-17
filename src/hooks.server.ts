import { building } from '$app/environment';
import { svelteKitHandler } from 'better-auth/svelte-kit';

import { auth, authReady } from '$lib/server/auth';

import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  await authReady;

  const session = await auth.api.getSession({
    headers: event.request.headers
  });

  if (session) {
    event.locals.session = session.session;
    event.locals.user = session.user;
  }

  return svelteKitHandler({ auth, event, resolve, building });
};
