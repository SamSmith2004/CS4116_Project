<script>
    import { tick, onMount, onDestroy } from 'svelte';
    import { page } from '$app/stores';
    import Toast from '$lib/components/Toast.svelte';
    import { showToast } from '$lib/toast.svelte.js';
    import formatTime from '$lib/utils/time.js';

    let { data } = $props();
    let convoId = $state($page.params?.id);
    
    // svelte-ignore state_referenced_locally
    const partnerName = data?.otherUser?.name || 'Unknown';

    let messages = $derived((data?.messages || []).map((m, idx) => ({
        id: m.id || idx,
        text: m.text,
        mediaUrl: m.mediaUrl,
        senderId: m.senderId,
        sender: m.senderId === data?.me?.id ? 'sender' : 'receiver',
        time: m.timestamp ? formatTime(m.timestamp) : ''
    })));

    let pollInterval = null; //TODO: look into possibly websockets

    let newMessage = $state('');
    let fileInput = $state(null);
    let attachedFileName = $state('');
    let formEl = $state(null);
    let sending = $state(false);
    let showReportModal = $state(false);
    let reportTarget = $state(null);
    let reportReason = $state('');
    let messageContainer = null;
    let _msgObserver = null;

    let showDeleteModal = $state(false);
    let deleteTarget = $state(null);

    function containsPhoneNumber(text = '') {
        if (!text) return false;

        const noAreaCodeNineToTenDigits = /\b\d{9,10}\b/;
        const plusAreaCodeWithLeadingZero = /\+\d{1,3}[\s.-]?0\d{8,10}\b/;
        const plusAreaCodeWithoutLeadingZero = /\+\d{1,3}[\s.-]?[1-9]\d{7,9}\b/;
        const areaCodeWithLeadingZero = /\b0\d{1,4}[\s.-]\d{3,4}[\s.-]\d{4}\b/;
        const areaCodeWithoutLeadingZero = /\b[1-9]\d{1,4}[\s.-]\d{3,4}[\s.-]\d{4}\b/;

        return (
            noAreaCodeNineToTenDigits.test(text) ||
            plusAreaCodeWithLeadingZero.test(text) ||
            plusAreaCodeWithoutLeadingZero.test(text) ||
            areaCodeWithLeadingZero.test(text) ||
            areaCodeWithoutLeadingZero.test(text)
        );
    }

    function handleKeydown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    }

    async function handleSubmit(e) {
        if (e && typeof e.preventDefault === 'function') e.preventDefault(); // Explodes without this 
        if (sending) return;
        const content = newMessage.trim();
        const file = fileInput?.files?.[0];
        if (!content && !file) {
            showToast('Please enter a message or attach an image', 'error');
            return;
        }
        
        if (content && containsPhoneNumber(content)) {
            showToast('Message not sent: phone numbers are not allowed.', 'error');
            return;
        }

        sending = true;
        try {
            const formData = new FormData(formEl);
            if (file) formData.append('media', file, file.name);

            const res = await fetch(formEl.action, {
                method: 'POST',
                body: formData
            });
            const resJson = await res.json().catch(() => { throw new Error('Invalid JSON response from server'); });

            if (resJson?.type === 'success') {
                const actionData = JSON.parse(resJson.data);
                const messageId = data[2]; // This should be in 0 but Svletekit is doing some weird padding of the array 

                messages = [
                    ...messages,
                    { id: messageId, text: content, mediaUrl: file ? URL.createObjectURL(file) : null, senderId: data?.me?.id, receiverId: data?.otherUser?.id, sender: 'sender', time: formatTime(Date.now()) }
                ];
                newMessage = '';
                if (fileInput) fileInput.value = '';
                attachedFileName = '';

                await tick();
                const container = messageContainer || document.getElementById('messageContainer');
                container?.scrollTo(0, container.scrollHeight);
            } else {
                // Remind me next time to just use a http endpoint and not this fancy svelte form for messaging
                const errMsg =
                    resJson?.error?.message ||
                    resJson?.data?.message ||
                    resJson?.message ||
                    res.statusText ||
                    String(res.status);
                showToast('Send failed: ' + errMsg, 'error');
            }
        } catch (e) {
            console.error('Send error:', e);
            showToast('Message failed to send', 'error');
        } finally {
            sending = false;
        }
    }

    function openDeleteModal(msg) {
        deleteTarget = msg;
        showDeleteModal = true;
    }

    function closeDeleteModal() {
        deleteTarget = null;
        showDeleteModal = false;
    }

    async function confirmDelete() {
        if (!deleteTarget) return;

        try {
            const res = await fetch(`/api/messages/delete/${deleteTarget.id}`, {
                method: 'DELETE'
            });
            if (!res.ok) {
                const err = await res.text();
                throw new Error(err || res.statusText || res.status);
            }

            messages = messages.filter((m) => m.id !== deleteTarget.id);
            showToast('Message deleted', 'success');
        } catch (err) {
            showToast('Delete error: ' + (err?.message || err), 'error');
        } finally {
            closeDeleteModal();
        }
    }

    async function handleReport(msg, reason) {
        if (!msg) return;

        try {
            const res = await fetch(`/api/messages/report/${msg.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: msg.senderId, reason })
            });

            if (!res.ok) {
                const errJson = await res.json().catch(() => null);
                const errMsg = errJson && errJson.message ? errJson.message : null;
                throw new Error(errMsg);
            }

            showToast('Message reported', 'success');
        } catch (err) {
            showToast('Report error: ' + (err?.message || err), 'error');
        }
    }

    function openReportModal(msg) {
        reportTarget = msg;
        reportReason = '';
        showReportModal = true;
    }

    function closeReportModal() {
        reportTarget = null;
        reportReason = '';
        showReportModal = false;
    }

    async function confirmReport() {
        if (!reportTarget) return;
        await handleReport(reportTarget, reportReason);
        closeReportModal();
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
                    senderId: m.senderId,
                    receiverId: m.receiverId,
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
                <div
                    class={msg.sender === 'sender'
                        ? 'relative max-w-[70%] min-w-0 px-4 py-2 rounded-xl wrap-break-words overflow-hidden bg-blue-500 text-white shadow'
                        : 'relative max-w-[70%] min-w-0 px-4 py-2 rounded-xl wrap-break-words overflow-hidden bg-white text-gray-900 shadow'}
                >
                    {#if msg.mediaUrl}
                        <div class="mt-1">
                            <a
                                href={msg.mediaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                class="inline-block"
                                aria-label="Open attachment in new tab"
                            >
                                <img
                                    src={msg.mediaUrl}
                                    alt="attachment"
                                    class="max-h-60 w-auto rounded-lg object-cover cursor-pointer"
                                />
                            </a>
                        </div>
                    {/if}

                    {#if msg.text}
                        <p class="text-sm whitespace-pre-wrap mt-2">{msg.text}</p>
                    {/if}

                    <div class="flex items-center justify-end gap-2 mt-1">
                        <span class="text-xs text-gray-400">{msg.time}</span>
                        {#if msg.sender === 'sender'}
                            <button
                                type="button"
                                class="text-sm text-gray-400 hover:text-red-500 ml-1 opacity-90"
                                aria-label="Delete message"
                                onclick={() => openDeleteModal(msg)}
                            >
                                <span class="material-symbols-rounded scale-75">delete</span>
                            </button>
                            {:else}
                            <button
                                type="button"
                                class="text-sm text-gray-400 hover:text-orange-500 ml-1 opacity-90"
                                aria-label="Report message"
                                onclick={() => openReportModal(msg)}
                            >
                                <span class="material-symbols-rounded scale-80">flag</span>
                            </button>
                        {/if}
                    </div>
                </div>
            </div>
        {/each}
    </div>

    <div class="border-t border-gray-200 p-4 bg-white">
        <input type="file" name="media" accept="image/*" bind:this={fileInput} class="hidden" id="fileInput" onchange={() => { attachedFileName = fileInput?.files?.[0]?.name || ''; }} />

        {#if attachedFileName}
            <div class="mb-2 w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 flex items-center justify-between">
                <div class="flex items-center gap-2 min-w-0">
                    <span class="material-symbols-rounded text-gray-600">attach_file</span>
                    <span class="text-sm text-gray-700 truncate">{attachedFileName}</span>
                </div>
                <button type="button" class="text-sm text-gray-500 ml-3" onclick={() => { if (fileInput) fileInput.value = ''; attachedFileName = ''; }} aria-label="Remove attachment">Remove</button>
            </div>
        {/if}

        <form bind:this={formEl} action="?/sendMessage" class="flex gap-2 w-full" onsubmit={handleSubmit} enctype="multipart/form-data">
            <input type="hidden" name="receiverId" value={data?.otherUser?.id || ''} />
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
                    disabled={sending}
                >
                    {sending ? 'Sending…' : 'Send'}
                </button>
            </div>
        </form>
    </div>

    {#if showReportModal}
        <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg shadow-lg w-full max-w-md p-4">
                <h3 class="text-lg font-semibold mb-2">Report message</h3>
                <p class="text-sm text-gray-600 mb-3">Please describe why you're reporting this message (optional).</p>
                <textarea bind:value={reportReason} rows="4" class="w-full border rounded p-2 mb-3" placeholder="Reason (optional)"></textarea>
                <div class="flex justify-end gap-2">
                    <button type="button" class="px-3 py-2 bg-gray-100 rounded" onclick={closeReportModal}>Cancel</button>
                    <button type="button" class="px-3 py-2 bg-red-500 text-white rounded" onclick={confirmReport}>Report</button>
                </div>
            </div>
        </div>
    {/if}
    {#if showDeleteModal}
        <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg shadow-lg w-full max-w-md p-4">
                <h3 class="text-lg font-semibold mb-2">Confirm delete</h3>
                <p class="text-sm text-gray-600 mb-3">Are you sure you want to delete this message? This action cannot be undone.</p>
                <div class="flex justify-end gap-2">
                    <button type="button" class="px-3 py-2 bg-gray-100 rounded" onclick={closeDeleteModal}>Cancel</button>
                    <button type="button" class="px-3 py-2 bg-red-500 text-white rounded" onclick={confirmDelete}>Delete</button>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    :global(html, body) {
        height: 100%;
    }
</style>
