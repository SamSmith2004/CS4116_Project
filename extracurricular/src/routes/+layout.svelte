<script>
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Navbar from '$lib/components/Navbar.svelte';
	import { page } from '$app/state';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link
		rel="stylesheet"
		href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
	/>
</svelte:head>

<div class="flex min-h-screen">
	{#if page.url.pathname !== "/login"}
		<Navbar />
	{/if}
	<main class="ml-16 flex-1 p-6">
		{@render children()}
	</main>
</div>
