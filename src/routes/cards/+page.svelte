<script lang="ts">
  import { cardPresets, findCardPreset, initialTrackedCards } from '$lib/data/card-presets';
  import CreditCardItem from '$lib/components/CreditCardItem.svelte';
  import { getNextAnnualDate } from '$lib/utils/card-dates';

  import type { AddTrackedCardInput, TrackedCard } from '$lib/types/cards';

  let addCardDialog: HTMLDialogElement;
  let trackedCards = $state<TrackedCard[]>(initialTrackedCards);
  let form = $state<AddTrackedCardInput>({
    presetId: cardPresets[0].id,
    nickname: '',
    annualRenewalDate: ''
  });

  function resetForm(): void {
    form = {
      presetId: cardPresets[0].id,
      nickname: '',
      annualRenewalDate: ''
    };
  }

  function addTrackedCard(event: SubmitEvent): void {
    event.preventDefault();

    const trimmedNickname = form.nickname.trim();

    if (!trimmedNickname || !form.annualRenewalDate) {
      return;
    }

    trackedCards = [
      ...trackedCards,
      {
        id: crypto.randomUUID(),
        presetId: form.presetId,
        nickname: trimmedNickname,
        annualRenewalDate: form.annualRenewalDate,
        nextFreeNightDate: getNextAnnualDate(form.annualRenewalDate)
      }
    ];

    resetForm();
    addCardDialog.close();
  }

  function getTrackedCardView(card: TrackedCard) {
    const preset = findCardPreset(card.presetId);

    return {
      ...preset,
      nickname: card.nickname,
      annualRenewalDate: card.annualRenewalDate,
      nextFreeNightDate: card.nextFreeNightDate
    };
  }
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

  <div class="flex flex-col gap-6">
    {#each trackedCards as trackedCard (trackedCard.id)}
      <CreditCardItem {...getTrackedCardView(trackedCard)} />
    {/each}
  </div>
</div>

<dialog class="modal" bind:this={addCardDialog}>
  <div class="modal-box">
    <h2 class="text-2xl font-bold">Add credit card</h2>

    <form class="mt-6 flex flex-col gap-4" onsubmit={addTrackedCard}>
      <label class="form-control w-full">
        <span class="label">
          <span class="label-text">Card</span>
        </span>
        <select class="select select-bordered w-full" bind:value={form.presetId} required>
          {#each cardPresets as preset (preset.id)}
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
          bind:value={form.nickname}
          placeholder="Alex's Hyatt"
          required
        />
      </label>

      <label class="form-control w-full">
        <span class="label">
          <span class="label-text">Annual renewal date</span>
        </span>
        <input
          class="input input-bordered w-full"
          type="date"
          bind:value={form.annualRenewalDate}
          required
        />
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
