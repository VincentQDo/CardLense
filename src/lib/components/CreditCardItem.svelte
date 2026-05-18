<script lang="ts">
  import { enhance } from '$app/forms';
  import { formatDateLabel, formatDaysUntilDate, getDaysUntilDate } from '$lib/utils/card-dates';

  import type { SubmitFunction } from '@sveltejs/kit';
  import type { Benefit } from '$lib/types/cards';

  const {
    id,
    name,
    image,
    annualFee,
    benefits = [],
    nickname,
    annualRenewalDate,
    certificateExpiryDate,
    freeNightUsed,
    freeNightRedemptionValue,
    onEdit
  }: {
    id: string;
    name: string;
    image: string;
    annualFee: number;
    benefits: Benefit[];
    nickname: string;
    annualRenewalDate: string;
    certificateExpiryDate: string;
    freeNightUsed: boolean;
    freeNightRedemptionValue: number;
    onEdit: () => void;
  } = $props();

  const daysUntilExpiry = $derived(getDaysUntilDate(certificateExpiryDate));
  const isUrgent = $derived(
    !freeNightUsed && daysUntilExpiry !== undefined && daysUntilExpiry <= 60
  );
  const statusBadgeClass = $derived(getStatusBadgeClass(freeNightUsed, isUrgent));
  const formattedRedemptionValue = $derived(formatCurrency(freeNightRedemptionValue));
  const usedActionTooltip = $derived(freeNightUsed ? 'Mark unused' : 'Mark used');
  const showRolloverAction = $derived(
    (daysUntilExpiry !== undefined && daysUntilExpiry < 0) || isPastDate(annualRenewalDate)
  );
  let deleteDialog: HTMLDialogElement;
  let redemptionDialog: HTMLDialogElement;

  function getStatusBadgeClass(isFreeNightUsed: boolean, hasUrgentExpiry: boolean): string {
    if (isFreeNightUsed) {
      return 'badge-success';
    }

    if (hasUrgentExpiry) {
      return 'badge-warning';
    }

    return 'badge-info';
  }

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  function isPastDate(dateInput: string): boolean {
    const daysUntilDate = getDaysUntilDate(dateInput);

    return daysUntilDate !== undefined && daysUntilDate < 0;
  }

  const closeRedemptionDialogAfterSubmit: SubmitFunction = () => {
    return async ({ result, update }) => {
      await update();

      if (result.type === 'success') {
        redemptionDialog.close();
      }
    };
  };
</script>

<article class="card bg-base-100 shadow-sm border border-base-300">
  <div class="absolute right-4 top-4 z-10 flex gap-1">
    {#if showRolloverAction}
      <div class="tooltip tooltip-bottom" data-tip="Roll to next cycle">
        <form method="POST" action="?/rollCard" use:enhance>
          <input type="hidden" name="cardId" value={id} />
          <button
            type="submit"
            class="btn btn-warning btn-outline btn-square btn-sm"
            aria-label={`Roll ${nickname} to the next cycle`}
          >
            <svg
              aria-hidden="true"
              class="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M21 12a9 9 0 0 1-15.5 6.2M3 12A9 9 0 0 1 18.5 5.8"
              />
              <path stroke-linecap="round" stroke-linejoin="round" d="M18.5 3v2.8H21" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M5.5 21v-2.8H3" />
            </svg>
          </button>
        </form>
      </div>
    {/if}

    {#if freeNightUsed}
      <div class="tooltip tooltip-bottom" data-tip={usedActionTooltip}>
        <form method="POST" action="?/toggleFreeNight" use:enhance>
          <input type="hidden" name="cardId" value={id} />
          <input type="hidden" name="freeNightUsed" value="false" />
          <button
            type="submit"
            class="btn btn-success btn-square btn-sm"
            aria-label={`Mark ${nickname} free night unused`}
          >
            <svg
              aria-hidden="true"
              class="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M3 10h10a5 5 0 1 1-3.5 8.5M3 10l4-4m-4 4 4 4"
              />
            </svg>
          </button>
        </form>
      </div>
    {:else}
      <div class="tooltip tooltip-bottom" data-tip={usedActionTooltip}>
        <button
          type="button"
          class="btn btn-primary btn-outline btn-square btn-sm"
          onclick={() => redemptionDialog.showModal()}
          aria-label={`Mark ${nickname} free night used`}
        >
          <svg
            aria-hidden="true"
            class="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M6 4h12a2 2 0 0 1 2 2v3a3 3 0 0 0 0 6v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3a3 3 0 0 0 0-6V6a2 2 0 0 1 2-2Z"
            />
            <path stroke-linecap="round" stroke-linejoin="round" d="m8.5 12 2.5 2.5 4.5-5" />
          </svg>
        </button>
      </div>
    {/if}

    <div class="tooltip tooltip-bottom" data-tip="Edit">
      <button
        type="button"
        class="btn btn-outline btn-square btn-sm"
        onclick={onEdit}
        aria-label={`Edit ${nickname}`}
      >
        <svg
          aria-hidden="true"
          class="h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="m16.5 3.5 4 4L8 20H4v-4L16.5 3.5Z"
          />
        </svg>
      </button>
    </div>

    <div class="tooltip tooltip-bottom" data-tip="Delete">
      <button
        type="button"
        class="btn btn-error btn-outline btn-square btn-sm"
        onclick={() => deleteDialog.showModal()}
        aria-label={`Delete ${nickname}`}
      >
        <svg
          aria-hidden="true"
          class="h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 7h16" />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M10 11v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3"
          />
        </svg>
      </button>
    </div>
  </div>

  <div class="card-body gap-6 pt-16 lg:flex-row lg:items-center lg:pt-8">
    <figure class="w-full max-w-80 overflow-hidden rounded-lg bg-base-200 lg:w-72">
      <img src={image} alt={name} />
    </figure>

    <div class="flex min-w-0 flex-1 flex-col gap-4">
      <div>
        <div class="flex flex-wrap items-center gap-2">
          <h2 class="text-xl font-semibold">{nickname}</h2>
          <div class={`badge ${statusBadgeClass} badge-outline`}>
            {freeNightUsed ? 'Free night used' : formatDaysUntilDate(certificateExpiryDate)}
          </div>
        </div>
        <div class="text-sm text-base-content/70">{name}</div>
      </div>

      <div class="stats stats-vertical bg-base-200 shadow-sm sm:stats-horizontal">
        <div class="stat">
          <div class="stat-title text-base-content/70">Annual fee</div>
          <div class="stat-value text-lg">${annualFee}</div>
        </div>

        <div class="stat">
          <div class="stat-title text-base-content/70">Refresh date</div>
          <div class="stat-value text-lg">{formatDateLabel(annualRenewalDate)}</div>
        </div>

        <div class="stat">
          <div class="stat-title text-base-content/70">Certificate expiry</div>
          <div class="stat-value text-lg">{formatDateLabel(certificateExpiryDate)}</div>
        </div>

        <div class="stat">
          <div class="stat-title text-base-content/70">Redeemed value</div>
          <div class="stat-value text-lg">{formattedRedemptionValue}</div>
        </div>
      </div>

      <div class="flex flex-wrap gap-2">
        {#each benefits as benefit (benefit.label)}
          <div class="badge badge-outline p-3">
            {benefit.label}: {benefit.value}
          </div>
        {/each}
      </div>
    </div>
  </div>
</article>

<dialog class="modal" bind:this={deleteDialog}>
  <div class="modal-box">
    <h2 class="text-2xl font-bold">Delete card?</h2>
    <p class="mt-3 text-base-content/70">
      This will remove <span class="font-semibold text-base-content">{nickname}</span> and its free night
      tracking history.
    </p>

    <div class="modal-action">
      <button type="button" class="btn" onclick={() => deleteDialog.close()}>Cancel</button>
      <form method="POST" action="?/deleteCard" use:enhance>
        <input type="hidden" name="cardId" value={id} />
        <button type="submit" class="btn btn-error">Delete card</button>
      </form>
    </div>
  </div>

  <form method="dialog" class="modal-backdrop">
    <button type="submit">close</button>
  </form>
</dialog>

<dialog class="modal" bind:this={redemptionDialog}>
  <div class="modal-box">
    <h2 class="text-2xl font-bold">Mark free night used</h2>
    <p class="mt-3 text-base-content/70">
      Track the dollar value you received when redeeming this certificate.
    </p>

    <form
      class="mt-6 flex flex-col gap-4"
      method="POST"
      action="?/toggleFreeNight"
      use:enhance={closeRedemptionDialogAfterSubmit}
    >
      <input type="hidden" name="cardId" value={id} />
      <input type="hidden" name="freeNightUsed" value="true" />

      <label class="form-control w-full">
        <span class="label">
          <span class="label-text">Redeemed value</span>
        </span>
        <input
          class="input input-bordered w-full"
          type="number"
          name="freeNightRedemptionValue"
          min="0"
          step="0.01"
          placeholder="315.50"
          required
        />
      </label>

      <div class="modal-action">
        <button type="button" class="btn" onclick={() => redemptionDialog.close()}>Cancel</button>
        <button type="submit" class="btn btn-primary">Mark used</button>
      </div>
    </form>
  </div>

  <form method="dialog" class="modal-backdrop">
    <button type="submit">close</button>
  </form>
</dialog>
