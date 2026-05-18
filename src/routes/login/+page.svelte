<script lang="ts">
  import { applyAction, enhance } from '$app/forms';

  import type { SubmitFunction } from '@sveltejs/kit';
  import type { PageProps } from './$types';

  type AuthMode = 'login' | 'signup';

  interface AuthFailure {
    email: string;
    message: string;
    mode: AuthMode;
  }

  const { form }: PageProps = $props();

  let mode = $state<AuthMode>('login');
  let email = $state('');
  let password = $state('');
  let message = $state('');
  let isSubmitting = $state(false);
  const isSignup = $derived(mode === 'signup');
  const submitLabel = $derived(getSubmitLabel(isSignup, isSubmitting));
  const emailError = $derived(getEmailError(email));
  const passwordError = $derived(getPasswordError(password, mode));

  $effect(() => {
    if (form?.mode) {
      mode = form.mode;
    }

    if (form?.email) {
      email = form.email;
    }

    message = form?.message ?? '';
  });

  const submitAuth: SubmitFunction = ({ cancel }) => {
    message = '';

    if (emailError || passwordError) {
      cancel();
      return;
    }

    isSubmitting = true;

    return async ({ result }) => {
      isSubmitting = false;

      if (result.type === 'failure' && isAuthFailure(result.data)) {
        message = result.data.message;
        email = result.data.email;
        mode = result.data.mode;
      }

      await applyAction(result);
    };
  };

  function selectMode(nextMode: AuthMode): void {
    mode = nextMode;
    message = '';
    password = '';
  }

  function getSubmitLabel(signup: boolean, submitting: boolean): string {
    if (submitting) {
      return signup ? 'Creating account...' : 'Signing in...';
    }

    return signup ? 'Create account' : 'Sign in';
  }

  function getEmailError(value: string): string {
    if (!value) {
      return '';
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Enter a valid email address.';
    }

    return '';
  }

  function getPasswordError(value: string, selectedMode: AuthMode): string {
    if (!value || selectedMode === 'login') {
      return '';
    }

    if (value.length < 8) {
      return 'Use at least 8 characters for your password.';
    }

    return '';
  }

  function isAuthFailure(value: unknown): value is AuthFailure {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const data = value as Record<string, unknown>;

    return (
      typeof data.email === 'string' &&
      typeof data.message === 'string' &&
      (data.mode === 'login' || data.mode === 'signup')
    );
  }
</script>

<div class="flex min-h-[calc(100vh-5rem)] items-center justify-center p-6">
  <section class="card w-full max-w-md border border-base-300 bg-base-100 shadow-sm">
    <div class="card-body gap-6">
      <div>
        <h1 class="text-2xl font-bold">{isSignup ? 'Create account' : 'Sign in'}</h1>
        <p class="mt-1 text-sm text-base-content/70">
          {isSignup
            ? 'Start tracking your card benefits privately.'
            : 'Access your saved card portfolio.'}
        </p>
      </div>

      <div class="tabs tabs-box">
        <button
          type="button"
          class={['tab', !isSignup && 'tab-active']}
          onclick={() => {
            selectMode('login');
          }}>Sign in</button
        >
        <button
          type="button"
          class={['tab', isSignup && 'tab-active']}
          onclick={() => {
            selectMode('signup');
          }}>Sign up</button
        >
      </div>

      {#if message}
        <div class="alert alert-error">
          <span>{message}</span>
        </div>
      {/if}

      <form class="flex flex-col gap-4" method="POST" novalidate use:enhance={submitAuth}>
        <input type="hidden" name="mode" value={mode} />

        <label class="form-control w-full">
          <span class="label">
            <span class="label-text">Email</span>
          </span>
          <input
            class="input input-bordered w-full"
            type="email"
            name="email"
            bind:value={email}
            autocomplete="email"
            disabled={isSubmitting}
            required
          />
          {#if emailError}
            <span class="label">
              <span class="label-text-alt text-error">{emailError}</span>
            </span>
          {/if}
        </label>

        <label class="form-control w-full">
          <span class="label">
            <span class="label-text">Password</span>
          </span>
          <input
            class="input input-bordered w-full"
            type="password"
            name="password"
            bind:value={password}
            autocomplete={isSignup ? 'new-password' : 'current-password'}
            disabled={isSubmitting}
            required
          />
          {#if passwordError}
            <span class="label">
              <span class="label-text-alt text-error">{passwordError}</span>
            </span>
          {/if}
        </label>

        <button type="submit" class={['btn btn-primary w-full', isSubmitting && 'btn-disabled']}>
          {submitLabel}
        </button>
      </form>
    </div>
  </section>
</div>
