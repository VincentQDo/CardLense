import { redirect } from '@sveltejs/kit';

import { auth } from '$lib/server/auth';
import { logInfo } from '$lib/server/logger';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, request }) => {
  await auth.api.signOut({
    headers: request.headers
  });

  logInfo('auth_logout_succeeded', {
    userId: locals.user?.id
  });

  redirect(303, '/login');
};
