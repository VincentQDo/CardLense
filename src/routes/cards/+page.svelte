<script lang="ts">
  import { enhance } from '$app/forms';
  import CreditCardItem from '$lib/components/CreditCardItem.svelte';
  import { findCardPreset } from '$lib/data/card-presets';

  import type { SubmitFunction } from '@sveltejs/kit';
  import type { PageProps } from './$types';

  const { data, form: actionResult }: PageProps = $props();

  let addCardDialog: HTMLDialogElement;
  let cardForm = $state({
    presetId: '',
    nickname: '',
    annualRenewalDate: '',
    certificateExpiryDate: '',
    freeNightUsed: false
  });

  $effect(() => {
    if (!cardForm.presetId) {
      cardForm.presetId = getDefaultPresetId();
    }
  });

  function resetForm(): void {
    cardForm = {
      presetId: getDefaultPresetId(),
      nickname: '',
      annualRenewalDate: '',
      certificateExpiryDate: '',
      freeNightUsed: false
    };
  }

  function getDefaultPresetId(): string {
    return data.cardPresets[0]?.id ?? '';
  }

  const closeModalAfterAdd: SubmitFunction = () => {
    return async ({ result, update }) => {
      await update();

      if (result.type === 'success') {
        addCardDialog.close();
      }
    };
  };
</script>

<div class="flex flex-col gap-6 p-6">
  <div class="flex flex-wrap items-center justify-between gap-4">
    <div>
      <h1 class="text-3xl font-bold">Cards</h1>
      <p class="text-base-content/60">Track renewal dates and upcoming free-night certificates.</p>
    </div>

    <button type="button" class="btn btn-primary" onclick={() => addCardDialog.showModal()}
      >Add card</button
    >
  </div>

  {#if actionResult?.message}
    <div class="alert alert-info">
      <span>{actionResult.message}</span>
    </div>
  {/if}

  <section class="stats stats-vertical bg-base-100 shadow-sm sm:stats-horizontal">
    <div class="stat">
      <div class="stat-title">Hotel cards</div>
      <div class="stat-value">{data.trackedCards.length}</div>
    </div>
    <div class="stat">
      <div class="stat-title">Available free nights</div>
      <div class="stat-value text-success">
        {data.trackedCards.filter((card) => !card.freeNightUsed).length}
      </div>
    </div>
    <div class="stat">
      <div class="stat-title">Used this cycle</div>
      <div class="stat-value text-info">
        {data.trackedCards.filter((card) => card.freeNightUsed).length}
      </div>
    </div>
  </section>

  <section class="flex flex-col gap-4">
    {#if data.trackedCards.length > 0}
      {#each data.trackedCards as trackedCard (trackedCard.id)}
        {@const preset = findCardPreset(trackedCard.presetId)}
        <CreditCardItem
          id={trackedCard.id}
          name={preset.name}
          image={preset.image}
          annualFee={preset.annualFee}
          benefits={preset.benefits}
          nickname={trackedCard.nickname}
          annualRenewalDate={trackedCard.annualRenewalDate}
          certificateExpiryDate={trackedCard.certificateExpiryDate}
          freeNightUsed={trackedCard.freeNightUsed}
        />
      {/each}
    {:else}
      <div class="hero rounded-lg bg-base-200 py-16">
        <div class="hero-content text-center">
          <div class="max-w-md">
            <h2 class="text-2xl font-bold">No hotel cards yet</h2>
            <p class="mt-2 text-base-content/60">
              Add your first card to track annual free-night refreshes and certificate deadlines.
            </p>
            <button
              type="button"
              class="btn btn-primary mt-6"
              onclick={() => addCardDialog.showModal()}>Add card</button
            >
          </div>
        </div>
      </div>
    {/if}
  </section>
</div>

<dialog class="modal" bind:this={addCardDialog} onclose={resetForm}>
  <div class="modal-box">
    <h2 class="text-2xl font-bold">Add credit card</h2>

    <form
      class="mt-6 flex flex-col gap-4"
      method="POST"
      action="?/addCard"
      use:enhance={closeModalAfterAdd}
    >
      <label class="form-control w-full">
        <span class="label">
          <span class="label-text">Card</span>
        </span>
        <select
          class="select select-bordered w-full"
          name="presetId"
          bind:value={cardForm.presetId}
          required
        >
          {#each data.cardPresets as preset (preset.id)}
            <option value={preset.id}>{preset.name}</option>
          {/each}
        </select>
      </label>

      <label class="form-control w-full">
        <span class="label">
          <span class="label-text">Nickname</span>
        </span>
        <input
          class="input input-bordered w-full"
          type="text"
          name="nickname"
          bind:value={cardForm.nickname}
          placeholder="Alex's Hyatt"
          required
        />
      </label>

      <div class="grid gap-4 sm:grid-cols-2">
        <label class="form-control w-full">
          <span class="label">
            <span class="label-text">Annual refresh date</span>
          </span>
          <input
            class="input input-bordered w-full"
            type="date"
            name="annualRenewalDate"
            bind:value={cardForm.annualRenewalDate}
            required
          />
        </label>

        <label class="form-control w-full">
          <span class="label">
            <span class="label-text">Certificate expiry date</span>
          </span>
          <input
            class="input input-bordered w-full"
            type="date"
            name="certificateExpiryDate"
            bind:value={cardForm.certificateExpiryDate}
            required
          />
        </label>
      </div>

      <label class="flex cursor-pointer items-center gap-3 rounded-lg border border-base-300 p-4">
        <input
          class="checkbox checkbox-primary"
          type="checkbox"
          name="freeNightUsed"
          bind:checked={cardForm.freeNightUsed}
        />
        <span>
          <span class="block font-medium">Free night already used</span>
          <span class="text-sm text-base-content/60">Start this card in a used state.</span>
        </span>
      </label>

      <div class="modal-action">
        <button type="button" class="btn btn-ghost" onclick={resetForm}>Clear</button>
        <button type="button" class="btn" onclick={() => addCardDialog.close()}>Cancel</button>
        <button type="submit" class="btn btn-primary">Add card</button>
      </div>
    </form>
  </div>

  <form method="dialog" class="modal-backdrop">
    <button type="submit">close</button>
  </form>
</dialog>
