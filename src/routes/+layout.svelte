<script lang="ts">
  import favicon from '$lib/assets/favicon.svg';
  import Navbar from '$lib/components/Navbar.svelte';
  import '../app.css';

  import type { LayoutProps } from './$types';

  const { children, data }: LayoutProps = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<Navbar user={data.user}></Navbar>
{@render children()}
