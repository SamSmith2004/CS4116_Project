<script>
    import TopBar from '$lib/components/TopBar.svelte';

    /** @type {import('./$types').PageProps} */
    let { data } = $props();

    const reported = $derived.by(() => data.reported ?? []);
    const banned = $derived.by(() => data.banned ?? []);

    function handleSearch() {
        // TODO
    }
</script>

<TopBar placeholder="Search reported users" onSearch={handleSearch} />

<div class="max-w-4xl mx-auto px-4 py-6">
    <h1 class="text-2xl font-semibold text-gray-900 mb-4">Reported Users</h1>

    {#if reported.length}
        <div class="bg-white border border-gray-200 rounded-2xl shadow-sm divide-y divide-gray-100 overflow-hidden mb-6">
            {#each reported as user (user.id)}
                <div class="px-4 py-3 sm:hidden">
                    <div class="flex flex-col gap-3">
                        <div class="flex min-w-0 items-center gap-3">
                            <div class="w-11 h-11 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                                {#if user.avatarUrl}
                                    <img src={user.avatarUrl} alt={`Avatar of ${user.name}`} class="w-full h-full object-cover" />
                                {:else}
                                    <span class="material-symbols-rounded text-[18px] text-gray-500">person</span>
                                {/if}
                            </div>
                            <div class="min-w-0">
                                <div class="text-sm font-semibold text-gray-900 wrap-break-word">{user.name}</div>
                                <div class="text-xs text-gray-500 wrap-break-word">Reported: {user.reportedAt} | Reason: {user.reason}</div>
                            </div>
                        </div>

                        <div class="grid w-full grid-cols-2 gap-2">
                            {#if user.isMessageReport}
                                <p class="text-center text-sm px-3 py-1 rounded-md bg-gray-50 border border-gray-200 hover:bg-gray-100">View Messages</p>
                            {/if}
                            <p class="text-center text-sm px-3 py-1 rounded-md bg-gray-50 border border-gray-200 hover:bg-gray-100">Edit Profile</p>
                            <button class="text-sm px-3 py-1 rounded-md border border-gray-200">Ban</button>
                            <button class="text-sm px-3 py-1 rounded-md bg-red-50 text-red-600 border border-red-100">Delete</button>
                        </div>
                    </div>
                </div>

                <div class="hidden sm:flex sm:items-center sm:justify-between sm:px-4 sm:py-3">
                    <div class="flex items-center gap-4">
                        <div class="w-11 h-11 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                            {#if user.avatarUrl}
                                <img src={user.avatarUrl} alt={`Avatar of ${user.name}`} class="w-full h-full object-cover" />
                            {:else}
                                <span class="material-symbols-rounded text-[18px] text-gray-500">person</span>
                            {/if}
                        </div>
                        <div>
                            <div class="text-sm font-semibold text-gray-900">{user.name}</div>
                            <div class="text-xs text-gray-500">Reported: {user.reportedAt} | Reason: {user.reason}</div>
                        </div>
                    </div>

                    <div class="flex items-center gap-2">
                        {#if user.isMessageReport}
                            <p class="text-sm px-3 py-1 rounded-md bg-gray-50 border border-gray-200 hover:bg-gray-100">View Messages</p>
                        {/if}
                        <p class="text-sm px-3 py-1 rounded-md bg-gray-50 border border-gray-200 hover:bg-gray-100">Edit Profile</p>
                        <button class="text-sm px-3 py-1 rounded-md border border-gray-200">Ban</button>
                        <button class="text-sm px-3 py-1 rounded-md bg-red-50 text-red-600 border border-red-100">Delete</button>
                    </div>
                </div>
            {/each}
        </div>
    {:else}
        <div class="flex flex-col items-center justify-center py-12 text-gray-500 mb-6">
            <span class="material-symbols-rounded text-[48px] mb-2">report</span>
            <p class="text-sm">No reported users</p>
        </div>
    {/if}

    <h2 class="text-xl font-semibold text-gray-900 mb-3">Banned Users</h2>
    {#if banned.length}
        <div class="bg-white border border-gray-200 rounded-2xl shadow-sm divide-y divide-gray-100 overflow-hidden">
            {#each banned as user (user.id)}
                <div class="flex items-center justify-between px-4 py-3">
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-full flex items-center justify-center bg-red-50 text-red-600 border border-red-200"> 
                            <span class="material-symbols-rounded text-[18px]">gavel</span>
                        </div>
                        <div>
                            <div class="text-sm font-semibold text-gray-900">{user.email}</div>
                        </div>
                    </div>

                </div>
            {/each}
        </div>
    {:else}
        <div class="flex flex-col items-center justify-center py-8 text-gray-500">
            <p class="text-sm">No banned users</p>
        </div>
    {/if}
</div>