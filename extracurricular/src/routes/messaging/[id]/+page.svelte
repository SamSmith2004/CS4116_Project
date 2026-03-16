<script>
    import { tick, onMount, onDestroy } from 'svelte';
    import { page } from '$app/stores';
    import Toast from '$lib/components/Toast.svelte';
    import { showToast } from '$lib/toast.svelte.js';
    import formatTime from '$lib/utils/time.js';

    let { data } = $props();
    let convoId = $state($page.params?.id);

    // TODO: Images
    
    // svelte-ignore state_referenced_locally
    const partnerName = data?.otherUser?.name || 'Unknown';

    let messages = $derived((data?.messages || []).map((m, idx) => ({
        id: m.id || idx,
        text: m.text,
        mediaUrl: m.mediaUrl,
        sender: m.senderId === data?.me?.id ? 'sender' : 'receiver',
        time: m.timestamp ? formatTime(m.timestamp) : ''
    })));

    let pollInterval = null; //TODO: look into possibly websockets

    let newMessage = $state('');
    let fileInput = $state(null);
    let formEl = $state(null);
    let sending = $state(false);
    let messageContainer = null;
    let _msgObserver = null;

    function handleKeydown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    }

    async function handleSubmit(e) {
        if (sending) return;
        const content = newMessage.trim();
        const file = fileInput?.files?.[0];
        if (!content && !file) return;

        sending = true;
        try {
            const formData = new FormData(formEl);
            const res = await fetch(formEl.action, {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                messages = [
                    ...messages,
                    { id: Date.now(), text: content, mediaUrl: file ? URL.createObjectURL(file) : null, sender: 'sender', time: formatTime(Date.now()) }
                ];
                newMessage = '';
                if (fileInput) fileInput.value = '';

                await tick();
                const container = messageContainer || document.getElementById('messageContainer');
                container?.scrollTo(0, container.scrollHeight);
            } else {
                showToast('Send failed: ' + (res.statusText || res.status), 'error');
            }
        } catch (e) {
            showToast('Send error: ' + (e?.message || e), 'error');
        } finally {
            sending = false;
        }
    }

    onMount(() => {
        // Auto-scroll to latest message
        const container = messageContainer || document.getElementById('messageContainer');
        if (!container) return;
        container.scrollTo(0, container.scrollHeight);

        _msgObserver = new MutationObserver(() => {
            container.scrollTo(0, container.scrollHeight);
        });
        _msgObserver.observe(container, { childList: true, subtree: true });

        // Poll messages every 5 seconds
        pollInterval = setInterval(async () => {
            try {
                const res = await fetch(`/messaging/${convoId}/messages`);
                if (!res.ok) return;
                const json = await res.json();
                const newMsgs = (json.messages || []).map((m) => ({
                    id: m.id,
                    text: m.text,
                    mediaUrl: m.mediaUrl,
                    sender: m.senderId === data?.me?.id ? 'sender' : 'receiver',
                    time: m.timestamp ? formatTime(m.timestamp) : ''
                }));
                messages = newMsgs;
            } catch (e) {
                // ignore polling errors
            }
        }, 5000);
    });

    onDestroy(() => {
        _msgObserver?.disconnect();
        if (pollInterval) clearInterval(pollInterval);
    });
</script>

<div class="flex flex-col h-screen">
    <header class="flex items-center px-4 py-2 bg-white border-b border-gray-200">
        <a href="/messaging" class="text-gray-500 hover:text-gray-700 mr-3">
            <span class="material-symbols-rounded">arrow_back</span>
        </a>
        <h2 class="text-lg font-semibold text-gray-900 truncate">{partnerName}</h2>
    </header>

    <Toast />

    <div id="messageContainer" bind:this={messageContainer} class="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {#each messages as msg (msg.id)}
            <div class="flex {msg.sender === 'sender' ? 'justify-end' : 'justify-start'}">
                <div class="max-w-[70%] min-w-0 px-4 py-2 rounded-xl wrap-break-words overflow-hidden
                    {msg.sender === 'sender' ? 'bg-blue-500 text-white' : 'bg-white text-gray-900'}
                    shadow">
                    <p class="text-sm whitespace-pre-wrap">{msg.text}</p>
                    <span class="text-xs text-gray-400 block text-right mt-1">{msg.time}</span>
                </div>
            </div>
        {/each}
    </div>

    <div class="border-t border-gray-200 p-4 bg-white">
        <form bind:this={formEl} action="?/sendMessage" class="flex gap-2 w-full" onsubmit={handleSubmit} enctype="multipart/form-data">
            <input type="hidden" name="receiverId" value={data?.otherUser?.id || ''} />
            <input type="file" name="media" accept="image/*" bind:this={fileInput} class="hidden" id="fileInput" />
            <textarea
                name="content"
                bind:value={newMessage}
                placeholder="Type a message..."
                rows="1"
                class="flex-1 px-4 py-2 border rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                onkeydown={handleKeydown}
            ></textarea>
            <div class="flex items-center gap-2">
                <button type="button" class="px-3 py-2 bg-gray-100 rounded-full" onclick={() => document.getElementById('fileInput')?.click()} title="Attach image">
                    📎
                </button>
                <button
                    type="submit"
                    class="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50"
                    disabled={sending || (!newMessage.trim() && !(fileInput?.files?.length > 0))}
                >
                    {sending ? 'Sending…' : 'Send'}
                </button>
            </div>
        </form>
    </div>
</div>

<style>
    :global(html, body) {
        height: 100%;
    }
</style>
