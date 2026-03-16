<script>
    import TopBar from '$lib/components/TopBar.svelte';
    import ConvoPreview from '$lib/components/ConvoPreview.svelte';
    import formatTime from '$lib/utils/time.js';

    import { page } from '$app/stores';
    let { data } = $props();

    let searchQuery = $state('');
    function handleSearch(query) {
        searchQuery = query;
    }

    const conversations =$derived((data?.conversations).map((c) => ({
        id: c.id,
        name: c.otherUser?.name || 'Unknown',
        lastMessage: c.lastMessage || '',
        time: c.timestamp ? formatTime(c.timestamp) : '',
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
</script>

<TopBar placeholder="Filter conversations" onSearch={handleSearch} />

<div class="max-w-2xl lg:max-w-5xl xl:max-w-7xl mx-auto px-4 py-4">
    <h1 class="text-xl font-semibold text-gray-900 mb-3">Messages</h1>

    <div class="bg-white border border-gray-200 rounded-2xl shadow-sm divide-y divide-gray-100 overflow-hidden">
        {#each filtered as convo (convo.id)}
            <a href={`/messaging/${convo.id}`} class="block" data-sveltekit-preload-data="hover">
                <ConvoPreview
                    name={convo.name}
                    lastMessage={convo.lastMessage}
                    time={convo.time}
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