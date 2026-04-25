<script>
    import { enhance } from '$app/forms';
    import { showToast } from '$lib/toast.svelte.js';

    /** @type {import('./$types').PageProps} */
    let { data } = $props();

    const reportedUser = $derived.by(() => data.reportedUser);
    const reportedMessagesData = $derived.by(() => data.reportedMessages ?? []);
    let reportedMessages = $state([]);

    $effect(() => {
        reportedMessages = [...reportedMessagesData];
    });

    const handleDeleteEnhance = () => {
        return async ({ result, formData }) => {
            if (result.type === 'failure' || result.type === 'error') {
                showToast('Failed to delete message', 'error');
                return;
            }

            if (result.type !== 'success') {
                return;
            }

            const messageId = formData.get('messageId')?.toString();
            if (!messageId) {
                return;
            }

            reportedMessages = reportedMessages.filter((message) => message.id !== messageId);
        };
    };
</script>

<div class="max-w-4xl mx-auto px-4 py-6">
    <div class="mb-5 rounded-2xl border border-gray-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-sm">
        <a href="/admin" class="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
            <span class="material-symbols-rounded text-[18px]">arrow_back</span>
            Back to admin
        </a>

        <h1 class="mt-2 text-xl font-semibold tracking-tight text-gray-900">Reported Messages</h1>
        <p class="text-sm text-gray-500">
            User: {reportedUser.name} ({reportedUser.email})
        </p>
    </div>

    {#if reportedMessages.length}
        <div class="bg-white border border-gray-200 rounded-2xl shadow-sm p-3 space-y-3">
            {#each reportedMessages as message (message.id)}
                <div class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4">
                    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div class="min-w-0">
                            <div class="text-xs text-gray-500 mb-2">
                                {message.reportCount} report(s) | Sent: {message.timestamp}
                            </div>
                            <div class="mb-3 space-y-2">
                                {#each message.reports as report, index (report.reportId)}
                                <div class="rounded-lg border border-gray-300 bg-white px-3 py-2">
                                    <div class="flex items-center justify-between mb-1">
                                        <p class="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Report #{index + 1}</p>
                                        <p class="text-xs text-gray-500">{report.reportedAt}</p>
                                    </div>
                                    <p class="text-sm text-gray-800 wrap-break-word">{report.reason}</p>
                                </div>
                                {/each}
                            </div>
                            <div class="rounded-lg border border-gray-300 bg-white px-3 py-2 mb-2">
                                <p class="text-[11px] font-semibold uppercase tracking-wide text-gray-600 mb-1">Message Content</p>
                                <div class="text-sm text-gray-900 wrap-break-word">
                                    {#if message.text}
                                        {message.text}
                                    {:else}
                                        <span class="text-gray-500 italic">No text message</span>
                                    {/if}
                                </div>
                            </div>
                            {#if message.mediaUrl}
                                <a href={message.mediaUrl} target="_blank" rel="noreferrer" class="text-sm text-blue-600 hover:text-blue-700">Open attached media</a>
                            {/if}
                        </div>

                        <form method="POST" action="?/deleteMessage" use:enhance={handleDeleteEnhance} class="sm:ml-4">
                            <input type="hidden" name="messageId" value={message.id} />
                            <button type="submit" class="text-sm px-3 py-1 rounded-md bg-red-50 text-red-600 border border-red-100 hover:bg-red-100">
                                Delete
                            </button>
                        </form>
                    </div>
                </div>
            {/each}
        </div>
    {:else}
        <div class="flex flex-col items-center justify-center py-12 text-gray-500">
            <span class="material-symbols-rounded text-[42px] mb-2">chat</span>
            <p class="text-sm">No reported messages found for this user</p>
        </div>
    {/if}
</div>
