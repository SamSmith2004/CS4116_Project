<script>
	import './layout.css';
	import favicon from '$lib/assets/favicon.png';
	import Navbar from '$lib/components/Navbar.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import { page } from '$app/state';

	let { children } = $props();
	let mobileMenuOpen = $state(false);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link
		rel="stylesheet"
		href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
	/>
</svelte:head>

<div class="flex min-h-screen">
	{#if page.url.pathname !== "/login" && page.url.pathname !== "/login/register-details"}
		<div class="hidden md:block">
			<Navbar />
		</div>

		<!-- Mobile Only-->
		{#if mobileMenuOpen}
			<div
				class="fixed inset-0 bg-black/50 z-40 md:hidden"
				onclick={() => (mobileMenuOpen = false)}
				role="button"
				tabindex="0"
				onkeydown={(e) => e.key === 'Escape' && (mobileMenuOpen = false)}
			></div>
		{/if}

		<div
			class="fixed left-0 top-0 h-full w-16 bg-white border-r border-gray-200 shadow-lg z-50 md:hidden transition-transform {mobileMenuOpen
				? 'translate-x-0'
				: '-translate-x-full'}"
		>
			<Navbar />
		</div>

		<button
			class="md:hidden fixed top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center transition-all {mobileMenuOpen
				? 'opacity-0 pointer-events-none'
				: 'left-0 z-50'}"
			onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
			aria-label="Toggle menu"
		>
			<div class="absolute inset-0 rounded-full -z-10 bg-white/20 border border-gray-200/20 shadow-sm"></div>
			<span class="material-symbols-rounded text-[20px]">chevron_right</span>
		</button>
		<!-- end -->
	{/if}

	<main class="{page.url.pathname !== '/login' && page.url.pathname !== "/login/register-details" ? 'md:ml-16' : ''} flex-1 w-full">
		{@render children()}
	</main>
</div>

<Toast />
