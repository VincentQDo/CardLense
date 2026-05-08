<script lang="ts">
  import { formatDateLabel } from '$lib/utils/card-dates';

  import type { Benefit } from '$lib/types/cards';

  const {
    name,
    image,
    annualFee,
    benefits = [],
    nickname,
    annualRenewalDate,
    nextFreeNightDate
  }: {
    name: string;
    image: string;
    annualFee: number;
    benefits: Benefit[];
    nickname?: string;
    annualRenewalDate?: string;
    nextFreeNightDate?: string;
  } = $props();
</script>

<div class="flex gap-8 items-center">
  <!-- 3D Card Wrapper -->
  <div class="hover-3d">
    <figure class="max-w-80 rounded-2xl">
      <img src={image} alt={name} />
    </figure>

    <!-- REQUIRED for 3D effect -->
    <div></div>
    <div></div>
    <div></div>
    <div></div>
    <div></div>
    <div></div>
    <div></div>
    <div></div>
  </div>

  <!-- Right Side: Benefits -->
  <div class="flex flex-col gap-3">
    <div>
      <div class="text-xl font-semibold">{nickname ?? name}</div>
      {#if nickname}
        <div class="text-sm text-base-content/60">{name}</div>
      {/if}
    </div>

    <div class="text-md">
      Annual Fee: <span class="font-medium">${annualFee}</span>
    </div>

    {#if annualRenewalDate || nextFreeNightDate}
      <div class="flex flex-wrap gap-2">
        {#if annualRenewalDate}
          <div class="badge badge-info badge-outline">
            Renewal: {formatDateLabel(annualRenewalDate)}
          </div>
        {/if}

        {#if nextFreeNightDate}
          <div class="badge badge-success badge-outline">
            Next free night: {formatDateLabel(nextFreeNightDate)}
          </div>
        {/if}
      </div>
    {/if}

    <div class="flex flex-wrap gap-2 mt-2">
      {#each benefits as benefit (benefit.label)}
        <div class="badge badge-outline p-3">
          {benefit.label}: {benefit.value}
        </div>
      {/each}
    </div>
  </div>
</div>
