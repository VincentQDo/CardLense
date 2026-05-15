<script lang="ts">
  import { enhance } from '$app/forms';
  import { formatDateLabel, formatDaysUntilDate, getDaysUntilDate } from '$lib/utils/card-dates';

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
    freeNightUsed
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
  } = $props();

  const daysUntilExpiry = $derived(getDaysUntilDate(certificateExpiryDate));
  const isUrgent = $derived(
    !freeNightUsed && daysUntilExpiry !== undefined && daysUntilExpiry <= 60
  );
  const statusBadgeClass = $derived(getStatusBadgeClass(freeNightUsed, isUrgent));

  function getStatusBadgeClass(isFreeNightUsed: boolean, hasUrgentExpiry: boolean): string {
    if (isFreeNightUsed) {
      return 'badge-success';
    }

    if (hasUrgentExpiry) {
      return 'badge-warning';
    }

    return 'badge-info';
  }
</script>

<article class="card bg-base-100 shadow-sm border border-base-300">
  <div class="card-body gap-6 lg:flex-row lg:items-center">
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
        <div class="text-sm text-base-content/60">{name}</div>
      </div>

      <div class="stats stats-vertical bg-base-200 shadow-sm sm:stats-horizontal">
        <div class="stat">
          <div class="stat-title">Annual fee</div>
          <div class="stat-value text-lg">${annualFee}</div>
        </div>

        <div class="stat">
          <div class="stat-title">Refresh date</div>
          <div class="stat-value text-lg">{formatDateLabel(annualRenewalDate)}</div>
        </div>

        <div class="stat">
          <div class="stat-title">Certificate expiry</div>
          <div class="stat-value text-lg">{formatDateLabel(certificateExpiryDate)}</div>
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

    <form method="POST" action="?/toggleFreeNight" use:enhance>
      <input type="hidden" name="cardId" value={id} />
      <input type="hidden" name="freeNightUsed" value={freeNightUsed ? 'false' : 'true'} />
      <button
        type="submit"
        class={`btn ${freeNightUsed ? 'btn-success' : 'btn-outline'} whitespace-nowrap`}
      >
        {freeNightUsed ? 'Used' : 'Mark used'}
      </button>
    </form>
  </div>
</article>
