<script lang="ts">
  import { enhance } from '$app/forms';
  import CreditCardItem from '$lib/components/CreditCardItem.svelte';
  import { findCardPreset } from '$lib/data/card-presets';

  import type { SubmitFunction } from '@sveltejs/kit';
  import type { TrackedCard } from '$lib/types/cards';
  import type { PageProps } from './$types';

  const { data, form: actionResult }: PageProps = $props();

  let addCardDialog: HTMLDialogElement;
  let editCardDialog: HTMLDialogElement;
  let cardForm = $state({
    presetId: '',
    nickname: '',
    annualRenewalDate: '',
    certificateExpiryDate: '',
    freeNightUsed: false
  });
  let editCardForm = $state({
    cardId: '',
    presetId: '',
    nickname: '',
    annualRenewalDate: '',
    certificateExpiryDate: ''
  });
  const totalAnnualFees = $derived(
    data.trackedCards.reduce((total, card) => total + card.annualFee, 0)
  );
  const totalRedeemedValue = $derived(
    data.trackedCards.reduce((total, card) => total + card.annualizedCreditValue, 0)
  );
  const netTrackedValue = $derived(totalRedeemedValue - totalAnnualFees);

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

  function resetEditForm(): void {
    editCardForm = {
      cardId: '',
      presetId: getDefaultPresetId(),
      nickname: '',
      annualRenewalDate: '',
      certificateExpiryDate: ''
    };
  }

  function openEditCard(card: TrackedCard): void {
    editCardForm = {
      cardId: card.id,
      presetId: card.presetId,
      nickname: card.nickname,
      annualRenewalDate: card.annualRenewalDate,
      certificateExpiryDate: card.certificateExpiryDate
    };
    editCardDialog.showModal();
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

  const closeModalAfterEdit: SubmitFunction = () => {
    return async ({ result, update }) => {
      await update();

      if (result.type === 'success') {
        editCardDialog.close();
      }
    };
  };

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
      maximumFractionDigits: 2
    }).format(value);
  }
</script>

<div class="flex flex-col gap-6 p-6">
  <div class="flex flex-wrap items-center justify-between gap-4">
    <div>
      <h1 class="text-3xl font-bold">Cards</h1>
      <p class="text-base-content/70">Track renewal dates, credit values, and annual card math.</p>
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

  <section class="card bg-base-100 shadow-sm border border-base-300">
    <div class="card-body gap-4 p-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold">Portfolio summary</h2>
          <p class="text-sm text-base-content/70">Annualized credit value against card fees.</p>
        </div>
        <div class="badge badge-primary badge-outline">{data.trackedCards.length} cards</div>
      </div>

      <div class="grid gap-3 sm:grid-cols-3">
        <div class="rounded-lg bg-base-200 p-3">
          <div class="text-xs text-base-content/70">Annual fees</div>
          <div class="text-lg font-semibold">{formatCurrency(totalAnnualFees)}</div>
        </div>
        <div class="rounded-lg bg-base-200 p-3">
          <div class="text-xs text-base-content/70">Annualized value</div>
          <div class="text-lg font-semibold text-success">{formatCurrency(totalRedeemedValue)}</div>
        </div>
        <div class="rounded-lg bg-base-200 p-3">
          <div class="text-xs text-base-content/70">Net</div>
          <div class="text-lg font-semibold">{formatCurrency(netTrackedValue)}</div>
        </div>
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
          freeNightRedemptionValue={trackedCard.freeNightRedemptionValue}
          creditValuations={trackedCard.creditValuations}
          annualizedCreditValue={trackedCard.annualizedCreditValue}
          netValue={trackedCard.netValue}
          onEdit={() => openEditCard(trackedCard)}
        />
      {/each}
    {:else}
      <div class="hero rounded-lg bg-base-200 py-16">
        <div class="hero-content text-center">
          <div class="max-w-md">
            <h2 class="text-2xl font-bold">No cards yet</h2>
            <p class="mt-2 text-base-content/70">
              Add your first card to track benefit credits, annual fees, and net value.
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

<dialog class="modal" bind:this={editCardDialog} onclose={resetEditForm}>
  <div class="modal-box">
    <h2 class="text-2xl font-bold">Edit credit card</h2>

    <form
      class="mt-6 flex flex-col gap-4"
      method="POST"
      action="?/editCard"
      use:enhance={closeModalAfterEdit}
    >
      <input type="hidden" name="cardId" value={editCardForm.cardId} />

      <label class="form-control w-full">
        <span class="label">
          <span class="label-text">Card</span>
        </span>
        <select
          class="select select-bordered w-full"
          name="presetId"
          bind:value={editCardForm.presetId}
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
          bind:value={editCardForm.nickname}
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
            bind:value={editCardForm.annualRenewalDate}
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
            bind:value={editCardForm.certificateExpiryDate}
            required
          />
        </label>
      </div>

      <label class="flex cursor-pointer items-center gap-3 rounded-lg border border-base-300 p-4">
        <input type="hidden" name="freeNightRedemptionValue" value="0" />
        <span>
          <span class="block font-medium">Credit values</span>
          <span class="text-sm text-base-content/70"
            >Edit individual credit values directly on the card.</span
          >
        </span>
      </label>

      <div class="modal-action">
        <button type="button" class="btn" onclick={() => editCardDialog.close()}>Cancel</button>
        <button type="submit" class="btn btn-primary">Save changes</button>
      </div>
    </form>
  </div>

  <form method="dialog" class="modal-backdrop">
    <button type="submit">close</button>
  </form>
</dialog>
