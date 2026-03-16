<script>
	import { authClient } from "$lib/auth-client" 
	import { goto } from "$app/navigation"
	import { onMount } from 'svelte';

	let isAdmin = false;

	onMount(async () => {
		try {
			const res = await fetch('/api/is-admin');
			if (res.ok) {
				const data = await res.json();
				isAdmin = data.isAdmin;
			} else {
				isAdmin = false;
			}
		} catch (e) {
			console.error('Failed to fetch is-admin', e);
			isAdmin = false;
		}
	});

	async function handleSignOut() {
        try {
            console.log("Signing user out...")
            await authClient.signOut();
            goto("/login");
        } catch (error) {
            console.error(error);
            alert("Failed to sign out");
        }
    }
</script>

<nav class="fixed left-0 top-0 h-screen w-16 flex flex-col items-center py-6 gap-2 bg-white border-r border-gray-200 shadow-sm z-50">
	<a href="/" title="Home" class="flex items-center justify-center w-11 h-11 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
		<span class="material-symbols-rounded text-[26px]">home</span>
	</a>
	<a href="/profile" title="Profile" class="flex items-center justify-center w-11 h-11 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
		<span class="material-symbols-rounded text-[26px]">person</span>
	</a>
	<a href="/messaging" title="Messaging" class="flex items-center justify-center w-11 h-11 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
		<span class="material-symbols-rounded text-[26px]">chat</span>
	</a>
	<a href="/matches" title="Matches" class="flex items-center justify-center w-11 h-11 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
		<span class="material-symbols-rounded text-[26px]">favorite</span>
	</a>
	<a href="/events" title="Events" class="flex items-center justify-center w-11 h-11 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
		<span class="material-symbols-rounded text-[26px]">event</span>
	</a>

	{#if isAdmin}
	<a href="/admin" title="Admin" class="flex items-center justify-center w-11 h-11 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
		<span class="material-symbols-rounded text-[26px]">admin_panel_settings</span>
	</a>
	{/if}

	<button on:click={handleSignOut} title="Sign Out" class="mt-auto flex items-center justify-center w-11 h-11 rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
        <span class="material-symbols-rounded text-[26px]">logout</span>
    </button>
</nav>
