<script lang="ts">
  type Benefit = {
    label: string;
    value: string;
  };

  let {
    name,
    image,
    annualFee,
    benefits = [],
  }: {
    name: string;
    image: string;
    annualFee: number;
    benefits: Benefit[];
  } = $props();
</script>

<div class="flex gap-8 items-center">
  <!-- 3D Card Wrapper -->
  <div class="hover-3d">
    <figure class="max-w-80 rounded-1xl">
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
    <div class="text-xl font-semibold">{name}</div>

    <div class="text-md">
      Annual Fee: <span class="font-medium">${annualFee}</span>
    </div>

    <div class="flex flex-wrap gap-2 mt-2">
      {#each benefits as benefit}
        <div class="badge badge-outline p-3">
          {benefit.label}: {benefit.value}
        </div>
      {/each}
    </div>
  </div>
</div>
