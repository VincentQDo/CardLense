<script lang="ts">
  import { enhance } from '$app/forms';
  import { formatDateLabel, formatDaysUntilDate, getDaysUntilDate } from '$lib/utils/card-dates';

  import type { Benefit, CreditValuation } from '$lib/types/cards';

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
    creditValuations,
    annualizedCreditValue,
    netValue,
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
    creditValuations: CreditValuation[];
    annualizedCreditValue: number;
    netValue: number;
    onEdit: () => void;
  } = $props();

  const daysUntilExpiry = $derived(getDaysUntilDate(certificateExpiryDate));
  const isUrgent = $derived(
    !freeNightUsed && daysUntilExpiry !== undefined && daysUntilExpiry <= 60
  );
  const statusBadgeClass = $derived(getStatusBadgeClass(freeNightUsed, isUrgent));
  const showRolloverAction = $derived(
    (daysUntilExpiry !== undefined && daysUntilExpiry < 0) || isPastDate(annualRenewalDate)
  );
  const attentionCredits = $derived(creditValuations.filter((credit) => credit.needsAttention));
  const manualCredits = $derived(creditValuations.filter((credit) => credit.requiresManualUse));
  const automaticCredits = $derived(creditValuations.filter((credit) => !credit.requiresManualUse));
  const informationalBenefits = $derived(benefits.filter(isInformationalBenefit));
  let deleteDialog: HTMLDialogElement;
  let creditDialog: HTMLDialogElement;

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

  function getNetValueClass(value: number): string {
    return value >= 0 ? 'text-success' : 'text-error';
  }

  function getDecisionBadgeClass(value: number): string {
    return value >= 0 ? 'badge-success' : 'badge-error';
  }

  function getDecisionLabel(value: number): string {
    return value >= 0 ? 'Worth keeping' : 'Review card';
  }

  function getCreditUrgencyLabel(credit: CreditValuation): string {
    if (credit.isExpired) {
      return 'Expired';
    }

    if (credit.expiresInDays === 0) {
      return 'Expires today';
    }

    if (credit.expiresInDays === 1) {
      return 'Expires tomorrow';
    }

    return `Expires in ${credit.expiresInDays} days`;
  }

  function getCreditPillClass(credit: CreditValuation): string {
    if (credit.needsAttention) {
      return 'badge-warning';
    }

    if (credit.requiresManualUse && credit.used) {
      return 'badge-success';
    }

    return 'badge-outline';
  }

  function getCreditPillLabel(credit: CreditValuation): string {
    if (credit.needsAttention) {
      return `${credit.name}: ${getCreditUrgencyLabel(credit)}`;
    }

    if (credit.creditId === 'certificate') {
      return credit.requiresManualUse && credit.used ? `${credit.name}: used` : credit.name;
    }

    if (credit.requiresManualUse && credit.used) {
      return `${credit.name}: ${formatCurrency(credit.userValue)} used`;
    }

    return `${credit.name}: ${formatCurrency(credit.userValue)}`;
  }

  function isInformationalBenefit(benefit: Benefit): boolean {
    const normalizedLabel = normalizeText(benefit.label);
    const normalizedValue = normalizeText(benefit.value);

    return !creditValuations.some((credit) => {
      const normalizedName = normalizeText(credit.name);
      const normalizedDescription = normalizeText(credit.description);

      return (
        normalizedName.includes(normalizedLabel) ||
        normalizedDescription.includes(normalizedLabel) ||
        normalizedDescription.includes(normalizedValue)
      );
    });
  }

  function normalizeText(value: string): string {
    return value.toLowerCase().replaceAll(/[^a-z0-9]+/g, '');
  }
</script>

<article class="card bg-base-100 shadow-sm border border-base-300">
  <div class="card-body gap-6 lg:flex-row lg:items-start">
    <figure class="w-full max-w-80 overflow-hidden rounded-lg bg-base-200 lg:w-72">
      <img src={image} alt={name} />
    </figure>

    <div class="flex min-w-0 flex-1 flex-col gap-4">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div class="min-w-0 flex-1">
          <div>
            <h2 class="break-words text-xl font-semibold">{nickname}</h2>
          </div>
          <div class="mt-1 flex flex-wrap items-center gap-2">
            <div
              class={`badge ${getDecisionBadgeClass(
                netValue
              )} badge-outline h-auto min-h-6 max-w-full whitespace-normal leading-tight`}
            >
              {getDecisionLabel(netValue)}
            </div>
            <div
              class={`badge ${statusBadgeClass} badge-outline h-auto min-h-6 max-w-full whitespace-normal leading-tight`}
            >
              {formatDaysUntilDate(certificateExpiryDate)}
            </div>
          </div>
          <div class="text-sm text-base-content/70">{name}</div>
        </div>
      </div>

      <div class="stats stats-vertical bg-base-200 shadow-sm sm:stats-horizontal">
        <div class="stat">
          <div class="stat-title text-base-content/70">Annual fee</div>
          <div class="stat-value text-lg">${annualFee}</div>
        </div>

        <div class="stat">
          <div class="stat-title text-base-content/70">Annual value</div>
          <div class="stat-value text-lg text-success">{formatCurrency(annualizedCreditValue)}</div>
        </div>

        <div class="stat">
          <div class="stat-title text-base-content/70">Net value</div>
          <div class={`stat-value text-lg ${getNetValueClass(netValue)}`}>
            {formatCurrency(netValue)}
          </div>
        </div>

        <div class="stat">
          <div class="stat-title text-base-content/70">Refresh date</div>
          <div class="stat-value text-lg">{formatDateLabel(annualRenewalDate)}</div>
        </div>
      </div>

      {#if attentionCredits.length > 0}
        <div
          class="inline-flex w-fit max-w-full flex-wrap items-center gap-2 rounded-lg border border-warning bg-warning/10 px-3 py-2 text-sm"
        >
          <span class="font-semibold text-warning">Needs attention</span>
          {#each attentionCredits as credit (credit.creditId)}
            <span
              class="badge badge-warning h-auto max-w-full rounded-full px-2 py-1 text-xs leading-tight whitespace-normal"
            >
              {credit.name}: {getCreditUrgencyLabel(credit)}
            </span>
          {/each}
        </div>
      {/if}

      <div>
        <div class="mb-2 text-xs font-semibold uppercase text-base-content/60">
          Benefits and credits
        </div>
        <div class="flex flex-wrap gap-2">
          {#each creditValuations as credit (credit.creditId)}
            <span
              class={`badge h-auto max-w-full rounded-full px-2 py-1 text-xs leading-tight whitespace-normal ${getCreditPillClass(
                credit
              )}`}
            >
              {getCreditPillLabel(credit)}
            </span>
          {/each}
          {#each informationalBenefits as benefit (benefit.label)}
            <div
              class="badge badge-outline h-auto max-w-full rounded-full px-2 py-1 text-xs leading-tight whitespace-normal"
            >
              {benefit.label}: {benefit.value}
            </div>
          {/each}
        </div>
      </div>

      <div class="card-actions justify-end border-t border-base-300 pt-3">
        {#if showRolloverAction}
          <div class="tooltip" data-tip="Roll to next cycle">
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

        <button
          type="button"
          class="btn btn-primary btn-sm"
          onclick={() => creditDialog.showModal()}
          aria-label={`Manage ${nickname} credits`}
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
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3 10h18" />
            <path d="M7 15h3" />
          </svg>
          <span>Manage credits</span>
        </button>

        <div class="tooltip" data-tip="Edit">
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

        <div class="tooltip" data-tip="Delete">
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
    </div>
  </div>
</article>

<dialog class="modal" bind:this={creditDialog}>
  <div class="modal-box max-w-5xl">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 class="text-2xl font-bold">{nickname} credits</h2>
        <p class="mt-1 text-sm text-base-content/70">
          Track manual credits when you use them. Monthly credits are treated as automatic.
        </p>
      </div>
      <div class={`badge ${getDecisionBadgeClass(netValue)} badge-outline`}>
        {formatCurrency(netValue)} net
      </div>
    </div>

    {#if attentionCredits.length > 0}
      <div class="alert alert-warning mt-5">
        <div>
          <div class="font-semibold">Use these before they expire</div>
          <div class="mt-1 flex flex-wrap gap-2">
            {#each attentionCredits as credit (credit.creditId)}
              <span class="badge badge-warning badge-outline">
                {credit.name}: {getCreditUrgencyLabel(credit)}
              </span>
            {/each}
          </div>
        </div>
      </div>
    {/if}

    <div class="mt-6 flex flex-col gap-6">
      <section>
        <h3 class="text-lg font-semibold">Manual credits</h3>
        <div class="mt-3 flex flex-col gap-3">
          {#each manualCredits as credit (credit.creditId)}
            <form
              class="rounded-lg border border-base-300 p-4"
              method="POST"
              action="?/updateCreditValue"
              use:enhance
            >
              <input type="hidden" name="cardId" value={id} />
              <input type="hidden" name="creditId" value={credit.creditId} />
              <input type="hidden" name="periodStart" value={credit.periodStart} />

              <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_9rem_8rem_8rem_auto] lg:items-end">
                <div>
                  <div class="font-medium">{credit.name}</div>
                  <div class="text-xs text-base-content/60">{credit.description}</div>
                  <div class="mt-1 text-xs text-base-content/60">
                    {credit.cadenceLabel} | {credit.periodLabel} | expires {formatDateLabel(
                      credit.periodEnd
                    )}
                  </div>
                  {#if credit.needsAttention}
                    <div class="mt-1 text-xs font-medium text-warning">
                      {getCreditUrgencyLabel(credit)}
                    </div>
                  {/if}
                </div>

                <label class="flex items-center gap-2">
                  <input
                    class="checkbox checkbox-primary"
                    type="checkbox"
                    name="used"
                    value="true"
                    checked={credit.used}
                    aria-label={`${credit.name} used`}
                  />
                  <span class="text-sm">Used</span>
                </label>

                <label class="form-control">
                  <span class="label py-1">
                    <span class="label-text text-xs">Value</span>
                  </span>
                  <input
                    class="input input-bordered input-sm"
                    type="number"
                    name="userValue"
                    min="0"
                    step="0.01"
                    value={credit.userValue}
                    aria-label={`${credit.name} value`}
                  />
                </label>

                <div>
                  <div class="text-xs text-base-content/60">Annualized</div>
                  <div class="font-medium">{formatCurrency(credit.annualizedValue)}</div>
                </div>

                <button type="submit" class="btn btn-primary btn-sm">Save</button>
              </div>
            </form>
          {/each}
        </div>
      </section>

      {#if automaticCredits.length > 0}
        <section>
          <h3 class="text-lg font-semibold">Automatic monthly credits</h3>
          <div class="mt-3 flex flex-col gap-3">
            {#each automaticCredits as credit (credit.creditId)}
              <form
                class="rounded-lg border border-base-300 p-4"
                method="POST"
                action="?/updateCreditValue"
                use:enhance
              >
                <input type="hidden" name="cardId" value={id} />
                <input type="hidden" name="creditId" value={credit.creditId} />
                <input type="hidden" name="periodStart" value={credit.periodStart} />

                <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_8rem_8rem_auto] lg:items-end">
                  <div>
                    <div class="font-medium">{credit.name}</div>
                    <div class="text-xs text-base-content/60">{credit.description}</div>
                  </div>

                  <label class="form-control">
                    <span class="label py-1">
                      <span class="label-text text-xs">Monthly value</span>
                    </span>
                    <input
                      class="input input-bordered input-sm"
                      type="number"
                      name="userValue"
                      min="0"
                      step="0.01"
                      value={credit.userValue}
                      aria-label={`${credit.name} monthly value`}
                    />
                  </label>

                  <div>
                    <div class="text-xs text-base-content/60">Annualized</div>
                    <div class="font-medium">{formatCurrency(credit.annualizedValue)}</div>
                  </div>

                  <button type="submit" class="btn btn-primary btn-sm">Save</button>
                </div>
              </form>
            {/each}
          </div>
        </section>
      {/if}
    </div>

    <div class="modal-action">
      <button type="button" class="btn" onclick={() => creditDialog.close()}>Close</button>
    </div>
  </div>

  <form method="dialog" class="modal-backdrop">
    <button type="submit">close</button>
  </form>
</dialog>

<dialog class="modal" bind:this={deleteDialog}>
  <div class="modal-box">
    <h2 class="text-2xl font-bold">Delete card?</h2>
    <p class="mt-3 text-base-content/70">
      This will remove <span class="font-semibold text-base-content">{nickname}</span> and its credit
      valuation tracking.
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
