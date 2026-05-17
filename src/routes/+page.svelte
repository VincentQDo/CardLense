<script lang="ts">
  import { resolve } from '$app/paths';
</script>

<div class="hero flex justify-center p-6">
  <div class="hero-content flex-col lg:flex-row gap-12 py-16 px-10">
    <div class="flex flex-col gap-6 max-w-md">
      <div class="flex items-center gap-2">
        <span class="badge badge-warning badge-sm tracking-widest uppercase text-xs font-semibold"
          >Credit Card Intelligence</span
        >
      </div>

      <div>
        <h1 class="text-5xl font-bold leading-tight">
          Know your benefits,<br />
          <span class="text-primary">use every perk.</span>
        </h1>
        <p class="mt-4 text-base-content/60 text-lg font-light leading-relaxed">
          CardLense tracks your credit card perks, deadlines, and hidden benefits — so you never
          leave value on the table again.
        </p>
      </div>

      <div class="flex flex-wrap gap-3 mt-2">
        <a href={resolve('/login?redirectTo=/cards')} class="btn btn-primary btn-md"
          >Get Started Free</a
        >
        <a href={resolve('/cards')} class="btn btn-ghost btn-md">See how it works →</a>
      </div>

      <div class="flex flex-wrap gap-2 mt-2">
        <span class="badge badge-outline badge-sm">Travel Credits</span>
        <span class="badge badge-outline badge-sm">Lounge Access</span>
        <span class="badge badge-outline badge-sm">Cashback</span>
        <span class="badge badge-outline badge-sm">+ 40 more</span>
      </div>

      <div class="stats stats-horizontal shadow bg-base-100 rounded-2xl">
        <div class="stat py-4 px-5">
          <div class="stat-title text-xs">Cards tracked</div>
          <div class="stat-value text-2xl text-primary">3.2k</div>
        </div>
        <div class="stat py-4 px-5">
          <div class="stat-title text-xs">Avg. saved/yr</div>
          <div class="stat-value text-2xl text-warning">$840</div>
        </div>
        <div class="stat py-4 px-5">
          <div class="stat-title text-xs">Benefits found</div>
          <div class="stat-value text-2xl text-success">98%</div>
        </div>
      </div>
    </div>

    <div class="relative w-72 h-80 flex-shrink-0">
      <div
        class="card w-64 bg-primary text-primary-content shadow-2xl absolute top-0 left-4 -rotate-6 z-10"
      >
        <div class="card-body p-5 gap-1">
          <div class="w-8 h-5 bg-warning rounded opacity-90"></div>
          <div class="mt-4">
            <p class="text-[10px] uppercase tracking-widest opacity-60">Platinum Rewards</p>
            <p class="font-semibold text-sm mt-0.5">Sapphire Reserve</p>
          </div>
        </div>
      </div>

      <div
        class="card w-64 bg-warning text-warning-content shadow-2xl absolute top-20 left-0 rotate-2 z-20"
      >
        <div class="card-body p-5 gap-1">
          <div class="w-8 h-5 bg-base-100 rounded opacity-70"></div>
          <div class="mt-4">
            <p class="text-[10px] uppercase tracking-widest opacity-60">Premium Travel</p>
            <p class="font-semibold text-sm mt-0.5">Amex Gold</p>
          </div>
        </div>
      </div>

      <div
        class="card w-64 bg-success text-success-content shadow-2xl absolute top-40 left-4 -rotate-1 z-30"
      >
        <div class="card-body p-5 gap-1">
          <div class="w-8 h-5 bg-base-100 rounded opacity-70"></div>
          <div class="mt-4">
            <p class="text-[10px] uppercase tracking-widest opacity-60">No Annual Fee</p>
            <p class="font-semibold text-sm mt-0.5">Freedom Unlimited</p>
          </div>
        </div>
      </div>

      <div
        class="badge badge-warning gap-1 shadow-lg absolute -right-4 top-6 z-40 text-xs py-3 px-3"
      >
        <span class="inline-block w-1.5 h-1.5 rounded-full bg-warning-content"></span>
        $300 credit unused
      </div>

      <div
        class="badge badge-success gap-1 shadow-lg absolute -right-6 top-52 z-40 text-xs py-3 px-3"
      >
        <span class="inline-block w-1.5 h-1.5 rounded-full bg-success-content"></span>
        12 lounge visits left
      </div>
    </div>
  </div>
</div>
