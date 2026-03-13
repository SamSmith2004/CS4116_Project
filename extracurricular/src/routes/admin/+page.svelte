<script>
    import TopBar from '$lib/components/TopBar.svelte';

    /** @type {import('./$types').PageProps} */
    let { data } = $props();

    const users = [
        { id: 1, name: 'John Doe', reason: 'Spam content', reportedAt: '2026-03-10', avatarColor: 'bg-red-400', banned: false },
        { id: 2, name: 'Jane Smith', reason: 'Harassment', reportedAt: '2026-03-09', avatarColor: 'bg-indigo-500', banned: false },
        { id: 3, name: 'Bob Lee', reason: 'Impersonation', reportedAt: '2026-03-08', avatarColor: 'bg-emerald-500', banned: true },
        { id: 4, name: 'Alice Park', reason: 'Inappropriate content', reportedAt: '2026-03-07', avatarColor: 'bg-yellow-500', banned: false }
    ];

    // TODO: actually query banned users
    const reported = users.filter(u => !u.banned);
    const banned = users.filter(u => u.banned);

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
                <div class="flex items-center justify-between px-4 py-3">
                    <div class="flex items-center gap-4">
                        <div class={`w-11 h-11 rounded-full flex items-center justify-center text-white ${user.avatarColor} font-medium`}> 
                            {user.name.split(' ').map(n => n[0]).slice(0,2).join('')}
                        </div>
                        <div>
                            <div class="text-sm font-semibold text-gray-900">{user.name}</div>
                            <div class="text-xs text-gray-500">Reported: {user.reportedAt} | Reason: {user.reason}</div>
                        </div>
                    </div>

                    <div class="flex items-center gap-2">
                        <p class="text-sm px-3 py-1 rounded-md bg-gray-50 border border-gray-200 hover:bg-gray-100">View Messages</p>
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
                        <div class={`w-10 h-10 rounded-full flex items-center justify-center text-white ${user.avatarColor} font-medium`}> 
                            {user.name.split(' ').map(n => n[0]).slice(0,2).join('')}
                        </div>
                        <div>
                            <div class="text-sm font-semibold text-gray-900">{user.name}</div>
                            <div class="text-xs text-gray-500">Reported: {user.reportedAt} | Reason: {user.reason}</div>
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