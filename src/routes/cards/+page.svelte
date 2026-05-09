<script lang="ts">
  import CreditCardItem from '$lib/components/CreditCardItem.svelte';

  const cardPresets = [
    { id: 'hyatt', name: 'World of Hyatt Credit Card' },
    { id: 'ihg', name: 'IHG Premier Card' }
  ] as const;

  let addCardDialog: HTMLDialogElement;
  let form = $state({
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

  function submitForm(event: SubmitEvent): void {
    event.preventDefault();
    console.log('Submitting card form', form);
    addCardDialog.close();
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
    <CreditCardItem />
  </div>
</div>

<dialog class="modal" bind:this={addCardDialog} onclose={resetForm}>
  <div class="modal-box">
    <h2 class="text-2xl font-bold">Add credit card</h2>

    <form class="mt-6 flex flex-col gap-4" onsubmit={submitForm}>
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
