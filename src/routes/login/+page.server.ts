import { fail, redirect } from '@sveltejs/kit';
import { APIError } from 'better-auth';

import { auth } from '$lib/server/auth';

import type { Actions, PageServerLoad } from './$types';

type AuthMode = 'login' | 'signup';

interface AuthFailure {
  email: string;
  message: string;
  mode: AuthMode;
}

export const load: PageServerLoad = ({ locals, url }) => {
  if (locals.user) {
    redirect(303, getSafeRedirectPath(url.searchParams.get('redirectTo')));
  }

  return {
    redirectTo: getSafeRedirectPath(url.searchParams.get('redirectTo'))
  };
};

export const actions: Actions = {
  default: async ({ request, url }) => {
    const formData = await request.formData();
    const mode = getAuthMode(formData);
    const email = getStringField(formData, 'email').trim().toLowerCase();
    const password = getStringField(formData, 'password');
    const redirectTo = getSafeRedirectPath(url.searchParams.get('redirectTo'));

    if (!email || !password) {
      return authFail(400, mode, email, 'Enter your email and password.');
    }

    if (!isEmailAddress(email)) {
      return authFail(400, mode, email, 'Enter a valid email address.');
    }

    if (mode === 'signup' && password.length < 8) {
      return authFail(400, mode, email, 'Use at least 8 characters for your password.');
    }

    try {
      if (mode === 'signup') {
        await signUp(request, email, password, redirectTo);
      } else {
        await signIn(request, email, password, redirectTo);
      }
    } catch (error) {
      return authFail(400, mode, email, getAuthErrorMessage(error, mode));
    }

    redirect(303, redirectTo);
  }
};

async function signIn(
  request: Request,
  email: string,
  password: string,
  callbackURL: string
): Promise<void> {
  await auth.api.signInEmail({
    body: {
      email,
      password,
      callbackURL,
      rememberMe: true
    },
    headers: request.headers
  });
}

async function signUp(
  request: Request,
  email: string,
  password: string,
  callbackURL: string
): Promise<void> {
  await auth.api.signUpEmail({
    body: {
      name: email,
      email,
      password,
      callbackURL,
      rememberMe: true
    },
    headers: request.headers
  });
}

function authFail(status: number, mode: AuthMode, email: string, message: string) {
  return fail<AuthFailure>(status, {
    email,
    message,
    mode
  });
}

function getAuthMode(formData: FormData): AuthMode {
  return getStringField(formData, 'mode') === 'signup' ? 'signup' : 'login';
}

function getStringField(formData: FormData, fieldName: string): string {
  const value = formData.get(fieldName);

  return typeof value === 'string' ? value : '';
}

function getSafeRedirectPath(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/cards';
  }

  return value;
}

function getAuthErrorMessage(error: unknown, mode: AuthMode): string {
  const message = getRawErrorMessage(error);

  if (mode === 'login') {
    return 'Email or password is incorrect.';
  }

  if (message.includes('exist') || message.includes('already')) {
    return 'An account with that email already exists. Sign in instead.';
  }

  return 'Could not create that account. Check your email and password, then try again.';
}

function getRawErrorMessage(error: unknown): string {
  if (error instanceof APIError || error instanceof Error) {
    return error.message.toLowerCase();
  }

  return '';
}

function isEmailAddress(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
