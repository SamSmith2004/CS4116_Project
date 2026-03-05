<script>
    import TopBar from '$lib/components/TopBar.svelte';
    import ConvoPreview from '$lib/components/ConvoPreview.svelte';

    // TODO: Replace with real data
    const names = [ 
        'Alice Murphy', 'Brian Kelly', 'Ciara Smith', 'Dylan Reeves',
        'Emma Walsh', 'Fionn Gallagher', 'Grace Nolan', 'Hugo Brennan',
        'Saoirse Flynn', 'Liam Doyle', 'Aoife Byrne', 'Oisín McCarthy',
        'Niamh Kavanagh', 'Conor Duffy', 'Róisín Healy', 'Cian Moran',
        'Éabha Daly', 'Seán Fitzgerald', 'Méabh Connolly', 'Darragh Quinn'
    ];
    const conversations = names.map((name, i) => ({
        id: i + 1,
        name,
        lastMessage: 'Hello',
        time: `${i}m ago`,
        avatarColor: 'bg-indigo-500'
    }));

    let searchQuery = $state('');
    function handleSearch(query) {
        searchQuery = query;
    }

    let filtered = $derived(
        searchQuery
            ? conversations.filter(c =>
                c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
            )
            : conversations
    );
</script>

<TopBar placeholder="Filter conversations" onSearch={handleSearch} />

<div class="max-w-4xl mx-auto px-4 py-4">
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