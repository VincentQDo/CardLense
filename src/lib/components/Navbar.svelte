<script lang="ts">
  import { resolve } from '$app/paths';

  interface NavbarUser {
    email: string;
    id: string;
    name: string;
  }

  interface Props {
    user: NavbarUser | null;
  }

  const { user }: Props = $props();

  const menuItems = [
    { label: 'Home', url: '/' },
    { label: 'Cards', url: '/cards' }
  ] as const;
  const visibleMenuItems = $derived(
    user ? menuItems : menuItems.filter((menuItem) => menuItem.url !== '/cards')
  );
</script>

<div class="max-lg:collapse bg-base-200 shadow-sm w-full rounded-md">
  <!-- Invisible button to toggle the navbar on small screen-->
  <input id="navbar-1-toggle" class="peer hidden" type="checkbox" />
  <label for="navbar-1-toggle" class="fixed inset-0 hidden max-lg:peer-checked:block"></label>
  <!-- Invisible button to toggle the navbar on small screen-->

  <!-- Large screen navbar -->
  <div class="collapse-title navbar">
    <!-- Navbar start -->
    <div class="navbar-start">
      <label for="navbar-1-toggle" class="btn btn-ghost lg:hidden">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          ><path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M4 12h8m-8 6h16"
          /></svg
        >
      </label>
      <a href={resolve('/')} class="btn btn-ghost text-xl">CardLense</a>
    </div>
    <!-- Navbar start -->

    <!-- Navbar center -->
    <div class="navbar-center hidden lg:flex">
      <ul class="menu menu-horizontal px-1">
        {#each visibleMenuItems as menuItem (menuItem.url)}
          <li><a href={resolve(menuItem.url)}>{menuItem.label}</a></li>
        {/each}
      </ul>
    </div>
    <!-- Navbar center -->

    <!-- Navbar end -->
    <div class="navbar-end">
      {#if user}
        <div class="hidden max-w-56 truncate text-sm text-base-content/70 sm:block">
          {user.email}
        </div>
        <form method="POST" action={resolve('/logout')} class="ml-3">
          <button type="submit" class="btn btn-ghost btn-sm">Log out</button>
        </form>
      {:else}
        <a href={resolve('/login?redirectTo=/cards')} class="btn btn-primary btn-sm mr-3">Sign in</a
        >
      {/if}
      <label class="toggle text-base-content">
        <input type="checkbox" value="corporate" class="theme-controller" />
        <svg aria-label="moon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
          ><g
            stroke-linejoin="round"
            stroke-linecap="round"
            stroke-width="2"
            fill="none"
            stroke="currentColor"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></g
          ></svg
        >
        <svg aria-label="sun" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
          ><g
            stroke-linejoin="round"
            stroke-linecap="round"
            stroke-width="2"
            fill="none"
            stroke="currentColor"
            ><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"
            ></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"
            ></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path
              d="m6.34 17.66-1.41 1.41"
            ></path><path d="m19.07 4.93-1.41 1.41"></path></g
          ></svg
        >
      </label>
    </div>
    <!-- Navbar end -->
  </div>
  <!-- Large screen navbar -->

  <!-- Small screen navbar -->
  <div class="collapse-content lg:hidden z-1">
    <ul class="menu">
      {#each visibleMenuItems as menuItem (menuItem.url)}
        <li><a href={resolve(menuItem.url)}>{menuItem.label}</a></li>
      {/each}
      {#if user}
        <li>
          <form method="POST" action={resolve('/logout')}>
            <button type="submit">Log out</button>
          </form>
        </li>
      {:else}
        <li><a href={resolve('/login?redirectTo=/cards')}>Sign in</a></li>
      {/if}
    </ul>
  </div>
  <!-- Small screen navbar -->
</div>
