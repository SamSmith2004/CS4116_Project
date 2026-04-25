<script>
    import TopBar from '$lib/components/TopBar.svelte';

    /** @type {import('./$types').PageProps} */
    let { data, form } = $props();

    const reported = $derived.by(() => data.reported ?? []);
    const banned = $derived.by(() => data.banned ?? []);
    let selectedUser = $state(null);
    let selectedReportTarget = $state(null);
    let selectedReason = $state(null);
    const MAX_REASON_PREVIEW = 30;
    let searchQuery = $state('');
    

    function handleSearch(query) {
        searchQuery = query;
    }

    const filteredReported = $derived(
        searchQuery
            ? reported.filter(u => 
                u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                u.reason?.toLowerCase().includes(searchQuery.toLowerCase()))
            : reported
    );

    const filteredBanned = $derived(
        searchQuery
            ? banned.filter(u => u.email.toLowerCase().includes(searchQuery.toLowerCase()))
            : banned
    );

    function openBanModal(user) {
        selectedUser = user;
    }

    function closeBanModal() {
        selectedUser = null;
    }

    function openDeleteReportModal(user) {
        selectedReportTarget = user;
    }

    function closeDeleteReportModal() {
        selectedReportTarget = null;
    }

    function isLongReason(reason) {
        return Boolean(reason) && reason.length > MAX_REASON_PREVIEW;
    }

    function reasonPreview(reason) {
        if (!reason) return '';
        return isLongReason(reason) ? `${reason.slice(0, MAX_REASON_PREVIEW)}...` : reason;
    }

    function openReasonModal(reason) {
        selectedReason = reason;
    }

    function closeReasonModal() {
        selectedReason = null;
    }
</script>

<TopBar placeholder="Search reported users" onSearch={handleSearch} />

<div class="max-w-4xl mx-auto px-4 py-6">
    {#if form?.message}
        <div class="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {form.message}
        </div>
    {/if}

    <div class="rounded-t-2xl border border-gray-200 border-b-0 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-sm">
        <div class="flex items-center justify-between gap-3">
            <h1 class="text-xl font-semibold tracking-tight text-gray-900">Reported Users</h1>
            <span class="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                {reported.length}
            </span>
        </div>
    </div>

    {#if reported.length}
        <div class="mb-6 overflow-hidden rounded-b-2xl border border-gray-200 bg-white shadow-sm divide-y divide-gray-100">
            {#each filteredReported as user (user.id)}
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
                                <div class="text-xs text-gray-500">Reported: {user.reportedAt}</div>
                                <div class="text-xs text-gray-500 wrap-break-word">
                                    Reason: {reasonPreview(user.reason)}
                                    {#if isLongReason(user.reason)}
                                        <button
                                            type="button"
                                            class="ml-1 font-medium text-gray-700 underline underline-offset-2 hover:text-gray-900"
                                            onclick={() => openReasonModal(user.reason)}
                                        >
                                            Show full
                                        </button>
                                    {/if}
                                </div>
                            </div>
                        </div>

                        <div class="grid w-full grid-cols-2 gap-2">
                            {#if user.isMessageReport}
                                <a href={`/admin/reports/${user.id}`} class="text-center text-sm px-3 py-1 rounded-md bg-gray-50 border border-gray-200 hover:bg-gray-100">View Messages</a>
                            {/if}
                            <a href={`/admin/profile/${user.userId}`} class="text-center text-sm px-3 py-1 rounded-md bg-gray-50 border border-gray-200 hover:bg-gray-100">Edit Profile</a>
                            <button
                                type="button"
                                class="text-sm px-3 py-1 rounded-md border border-gray-200"
                                onclick={() => openBanModal({ userId: user.userId, name: user.name, email: user.email })}
                                disabled={user.banned}
                            >
                                {user.banned ? 'Banned' : 'Ban'}
                            </button>
                            <button
                                type="button"
                                class="text-sm px-3 py-1 rounded-md bg-red-50 text-red-600 border border-red-100 hover:bg-red-100"
                                onclick={() => openDeleteReportModal({ userId: user.userId, name: user.name })}
                            >
                                Delete Report(s)
                            </button>
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
                            <div class="text-xs text-gray-500">Reported: {user.reportedAt}</div>
                            <div class="text-xs text-gray-500 wrap-break-word">
                                Reason: {reasonPreview(user.reason)}
                                {#if isLongReason(user.reason)}
                                    <button
                                        type="button"
                                        class="ml-1 font-medium text-gray-700 underline underline-offset-2 hover:text-gray-900"
                                        onclick={() => openReasonModal(user.reason)}
                                    >
                                        Show full
                                    </button>
                                {/if}
                            </div>
                        </div>
                    </div>

                    <div class="flex items-center gap-2">
                        {#if user.isMessageReport}
                            <a href={`/admin/reports/${user.id}`} class="text-sm px-3 py-1 rounded-md bg-gray-50 border border-gray-200 hover:bg-gray-100">View Messages</a>
                        {/if}
                        <a href={`/admin/profile/${user.userId}`} class="text-sm px-3 py-1 rounded-md bg-gray-50 border border-gray-200 hover:bg-gray-100">Edit Profile</a>
                        <button
                            type="button"
                            class="text-sm px-3 py-1 rounded-md border border-gray-200"
                            onclick={() => openBanModal({ userId: user.userId, name: user.name, email: user.email })}
                            disabled={user.banned}
                        >
                            {user.banned ? 'Banned' : 'Ban'}
                        </button>
                        <button
                            type="button"
                            class="text-sm px-3 py-1 rounded-md bg-red-50 text-red-600 border border-red-100 hover:bg-red-100"
                            onclick={() => openDeleteReportModal({ userId: user.userId, name: user.name })}
                        >
                            Delete Report(s)
                        </button>
                    </div>
                </div>
            {/each}
        </div>
    {:else}
        <div class="mb-6 flex flex-col items-center justify-center rounded-b-2xl border border-gray-200 bg-white py-12 text-gray-500 shadow-sm">
            <span class="material-symbols-rounded text-[48px] mb-2">report</span>
            <p class="text-sm">No reported users</p>
        </div>
    {/if}

    <div class="rounded-t-2xl border border-gray-200 border-b-0 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-sm">
        <div class="flex items-center justify-between gap-3">
            <h2 class="text-xl font-semibold tracking-tight text-gray-900">Banned Users</h2>
            <span class="rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                {banned.length}
            </span>
        </div>
    </div>
    {#if banned.length}
        <div class="overflow-hidden rounded-b-2xl border border-gray-200 bg-white shadow-sm divide-y divide-gray-100">
            {#each filteredBanned as user (user.id)}
                <div class="flex items-center justify-between px-4 py-3">
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-full flex items-center justify-center bg-red-50 text-red-600 border border-red-200"> 
                            <span class="material-symbols-rounded text-[18px]">gavel</span>
                        </div>
                        <div>
                            <div class="text-sm font-semibold text-gray-900">{user.email}</div>
                        </div>
                    </div>

                    <form method="POST" action="?/unbanUser" class="ml-4">
                        <input type="hidden" name="userId" value={user.id} />
                        <button type="submit" class="rounded-md border border-green-200 bg-green-50 px-3 py-1 text-sm text-green-700 hover:bg-green-100">
                            Unban
                        </button>
                    </form>

                </div>
            {/each}
        </div>
    {:else}
        <div class="flex flex-col items-center justify-center rounded-b-2xl border border-gray-200 bg-white py-8 text-gray-500 shadow-sm">
            <p class="text-sm">No banned users</p>
        </div>
    {/if}
</div>

{#if selectedUser}
    <div class="fixed inset-0 z-40 flex items-center justify-center p-4">
        <button
            type="button"
            class="absolute inset-0 bg-black/40"
            aria-label="Close ban confirmation"
            onclick={closeBanModal}
        ></button>

        <div class="relative z-10 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-xl">
            <h3 class="text-lg font-semibold text-gray-900">Ban User?</h3>
            <p class="mt-2 text-sm text-gray-600">
                Are you sure you want to permanently ban <span class="font-semibold text-gray-900">{selectedUser.name}</span>?
            </p>
            <p class="mt-1 text-sm text-gray-600">
                This will mark their account as banned and block access until they are unbanned.
            </p>

            <form method="POST" action="?/banUser" class="mt-5 flex items-center justify-end gap-2">
                <input type="hidden" name="userId" value={selectedUser.userId} />
                <button type="button" class="rounded-md border border-gray-200 px-3 py-1 text-sm" onclick={closeBanModal}>
                    Cancel
                </button>
                <button type="submit" class="rounded-md border border-red-200 bg-red-50 px-3 py-1 text-sm text-red-700 hover:bg-red-100">
                    Yes, ban permanently
                </button>
            </form>
        </div>
    </div>
{/if}

{#if selectedReason}
    <div class="fixed inset-0 z-40 flex items-center justify-center p-4">
        <button
            type="button"
            class="absolute inset-0 bg-black/40"
            aria-label="Close full reason"
            onclick={closeReasonModal}
        ></button>

        <div class="relative z-10 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-xl">
            <h3 class="text-lg font-semibold text-gray-900">Report reason</h3>
            <p class="mt-2 max-h-72 overflow-y-auto whitespace-pre-wrap wrap-break-word text-sm text-gray-700">{selectedReason}</p>

            <div class="mt-5 flex items-center justify-end">
                <button
                    type="button"
                    class="rounded-md border border-gray-200 px-3 py-1 text-sm"
                    onclick={closeReasonModal}
                >
                    Close
                </button>
            </div>
        </div>
    </div>
{/if}

{#if selectedReportTarget}
    <div class="fixed inset-0 z-40 flex items-center justify-center p-4">
        <button
            type="button"
            class="absolute inset-0 bg-black/40"
            aria-label="Close delete report confirmation"
            onclick={closeDeleteReportModal}
        ></button>

        <div class="relative z-10 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-xl">
            <h3 class="text-lg font-semibold text-gray-900">Delete Report(s)?</h3>
            <p class="mt-2 text-sm text-gray-600">
                You are deleting report records for <span class="font-semibold text-gray-900">{selectedReportTarget.name}</span>.
            </p>
            <p class="mt-1 text-sm text-gray-600">
                This only removes all reports about this user. It does <span class="font-semibold text-gray-900">not</span> delete or ban the user account.
            </p>

            <form method="POST" action="?/deleteReports" class="mt-5 flex items-center justify-end gap-2">
                <input type="hidden" name="userId" value={selectedReportTarget.userId} />
                <button type="button" class="rounded-md border border-gray-200 px-3 py-1 text-sm" onclick={closeDeleteReportModal}>
                    Cancel
                </button>
                <button type="submit" class="rounded-md border border-red-200 bg-red-50 px-3 py-1 text-sm text-red-700 hover:bg-red-100">
                    Yes, delete report(s)
                </button>
            </form>
        </div>
    </div>
{/if}