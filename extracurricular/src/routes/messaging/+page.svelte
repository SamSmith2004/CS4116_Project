<script>
    import TopBar from '$lib/components/TopBar.svelte';
    import ConvoPreview from '$lib/components/ConvoPreview.svelte';
    import formatTime from '$lib/utils/time.js';
    import { goto } from '$app/navigation';

    import { page } from '$app/stores';
	import { onMount } from 'svelte';
    let { data } = $props();

    let searchQuery = $state($page.url.searchParams.get('q') ?? '');

    function handleSearch(query) {
        searchQuery = query;

        const trimmed = query.trim();

        const nextUrl = trimmed
            ? `${$page.url.pathname}?q=${encodeURIComponent(trimmed)}`
            : $page.url.pathname;

        goto(nextUrl, {
            replaceState: true,
            noScroll: true,
            keepFocus: true,
            invalidateAll: false
        });
    }

    let pollInterval = null; //TODO: look into possibly websockets

    let conversations = $derived((data?.conversations).map((c) => ({
        id: c.id,
        name: c.otherUser?.name || 'Unknown',
        lastMessage: c.lastMessage || '',
        time: c.timestamp ? formatTime(c.timestamp) : '',
        avatarUrl: c.otherUser?.avatarUrl,
        avatarColor: 'bg-indigo-500'
    })));

    let filtered = $derived(
        searchQuery
            ? conversations.filter((c) =>
                  c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
              )
            : conversations
    );

    onMount(() => {
        // Poll messages every 5 seconds
        pollInterval = setInterval(async () => {
            try {
                const res = await fetch(`/messaging/convos`);
                if (!res.ok) return;
                const json = await res.json();
                const newConvos = json.conversations?.map((c) => ({
                    id: c.id,
                    name: c.otherUser?.name || 'Unknown',
                    lastMessage: c.lastMessage || '',
                    time: c.timestamp ? formatTime(c.timestamp) : '',
                    avatarUrl: c.otherUser?.avatarUrl,
                    avatarColor: 'bg-indigo-500'
                }));
                conversations = newConvos;
            } catch (e) {
                // ignore polling errors
            }
        }, 5000);
    });
</script>

<TopBar placeholder="Filter conversations" onSearch={handleSearch} />

<div class="max-w-2xl lg:max-w-5xl xl:max-w-7xl mx-auto px-4 py-4">
    <div class="bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-lg border border-white/20 mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Messages</h1>
    </div>

    <div class="bg-white border border-gray-200 rounded-2xl shadow-sm divide-y divide-gray-100 overflow-hidden">
        {#each filtered as convo (convo.id)}
            <a href={`/messaging/${convo.id}`} class="block" data-sveltekit-preload-data="hover">
                <ConvoPreview
                    name={convo.name}
                    lastMessage={convo.lastMessage}
                    time={convo.time}
                    avatarUrl={convo.avatarUrl}
                    avatarColor={convo.avatarColor}
                />
            </a>
        {:else}
            <div class="flex flex-col items-center justify-center py-12 text-gray-400">
                <span class="material-symbols-rounded text-[48px] mb-2">chat_bubble_outline</span>
                <p class="text-sm">No conversations found</p>
            </div>
        {/each}
    </div>
</div>