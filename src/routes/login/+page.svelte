<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';

  import type { SubmitFunction } from '@sveltejs/kit';
  import type { PageProps } from './$types';

  const { form }: PageProps = $props();

  let mode = $state<'login' | 'signup'>('login');
  let isSubmitting = $state(false);
  const isSignup = $derived(mode === 'signup');
  const submitLabel = $derived(getSubmitLabel(isSignup, isSubmitting));

  $effect(() => {
    if (form?.mode) {
      mode = form.mode;
    }
  });

  const submitAuth: SubmitFunction = () => {
    isSubmitting = true;

    return async ({ result, update }) => {
      isSubmitting = false;

      if (result.type === 'redirect') {
        await goto(resolve(result.location as Parameters<typeof resolve>[0]));
        return;
      }

      await update();
    };
  };

  function getSubmitLabel(signup: boolean, submitting: boolean): string {
    if (submitting) {
      return signup ? 'Creating account...' : 'Signing in...';
    }

    return signup ? 'Create account' : 'Sign in';
  }
</script>

<div class="flex min-h-[calc(100vh-5rem)] items-center justify-center p-6">
  <section class="card w-full max-w-md border border-base-300 bg-base-100 shadow-sm">
    <div class="card-body gap-6">
      <div>
        <h1 class="text-2xl font-bold">{isSignup ? 'Create account' : 'Sign in'}</h1>
        <p class="mt-1 text-sm text-base-content/60">
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
            mode = 'login';
          }}>Sign in</button
        >
        <button
          type="button"
          class={['tab', isSignup && 'tab-active']}
          onclick={() => {
            mode = 'signup';
          }}>Sign up</button
        >
      </div>

      {#if form?.message}
        <div class="alert alert-error">
          <span>{form.message}</span>
        </div>
      {/if}

      <form class="flex flex-col gap-4" method="POST" use:enhance={submitAuth}>
        <input type="hidden" name="mode" value={mode} />

        <label class="form-control w-full">
          <span class="label">
            <span class="label-text">Email</span>
          </span>
          <input
            class="input input-bordered w-full"
            type="email"
            name="email"
            value={form?.email ?? ''}
            autocomplete="email"
            disabled={isSubmitting}
            required
          />
        </label>

        <label class="form-control w-full">
          <span class="label">
            <span class="label-text">Password</span>
          </span>
          <input
            class="input input-bordered w-full"
            type="password"
            name="password"
            minlength="8"
            autocomplete={isSignup ? 'new-password' : 'current-password'}
            disabled={isSubmitting}
            required
          />
        </label>

        <button type="submit" class={['btn btn-primary w-full', isSubmitting && 'btn-disabled']}>
          {submitLabel}
        </button>
      </form>
    </div>
  </section>
</div>
