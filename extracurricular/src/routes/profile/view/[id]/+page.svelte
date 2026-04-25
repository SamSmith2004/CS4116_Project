<script>
    import { goto } from '$app/navigation';
    import ProfileReadonlyCard from '$lib/components/ProfileReadonlyCard.svelte';
    import Toast from '$lib/components/Toast.svelte';
    import { showToast } from '$lib/toast.svelte.js';

    let { data } = $props();

    const profile = $derived(data.profile);
    let showReportModal = $state(false);
    let reportReason = $state('');
    let reporting = $state(false);

    function goBack() {
        if (window.history.length > 1) {
            window.history.back();
            return;
        }

        goto('/'); // fallback
    }

    function openReportModal() {
        reportReason = '';
        showReportModal = true;
    }

    function closeReportModal() {
        showReportModal = false;
        reportReason = '';
    }

    async function confirmReport() {
        if (!profile?.id || reporting) return;

        reporting = true;
        try {
            const res = await fetch(`/api/users/report/${profile.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: reportReason })
            });

            if (!res.ok) {
                const errJson = await res.json().catch(() => null);
                const errMsg = errJson && errJson.message ? errJson.message : null;
                throw new Error(errMsg);
            }

            showToast('Profile reported', 'success');
            closeReportModal();
        } catch (err) {
            showToast('Report error: ' + (err?.message || err), 'error');
        } finally {
            reporting = false;
        }
    }
</script>

<div class="flex min-h-screen flex-col">
    <header class="border-b border-gray-200 bg-white px-4 py-4 shadow-sm md:px-8">
        <div class="flex flex-col gap-3 md:grid md:grid-cols-3 md:items-center">
        <div class="flex justify-start">
            <button
                type="button"
                onclick={goBack}
                class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
            >
                <span class="material-symbols-rounded text-[18px]">arrow_back</span>
                Back
            </button>
        </div>
        <h1 class="text-center text-2xl font-bold uppercase tracking-widest text-gray-800">Profile</h1>
        <div class="flex justify-center md:justify-end">
            <button
                type="button"
                class="inline-flex items-center gap-1 rounded-full bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
                onclick={openReportModal}
            >
                <span class="material-symbols-rounded text-[18px]">flag</span>
                Report
            </button>
        </div>
        </div>
    </header>

    <Toast />

    <main class="mx-auto w-full max-w-6xl p-4 md:p-8">
        <div class="rounded-3xl border border-gray-200/80 bg-white/85 p-6 shadow-xl backdrop-blur-md md:p-8">
            <ProfileReadonlyCard {profile} />
        </div>
    </main>

    {#if showReportModal}
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div class="w-full max-w-md rounded-lg bg-white p-4 shadow-lg">
                <h3 class="mb-2 text-lg font-semibold">Report profile</h3>
                <p class="mb-3 text-sm text-gray-600">Please describe why you're reporting this profile (optional).</p>
                <textarea
                    bind:value={reportReason}
                    rows="4"
                    class="mb-3 w-full rounded border p-2"
                    placeholder="Reason (optional)"
                ></textarea>
                <div class="flex justify-end gap-2">
                    <button type="button" class="rounded bg-gray-100 px-3 py-2" onclick={closeReportModal}>Cancel</button>
                    <button
                        type="button"
                        class="rounded bg-red-500 px-3 py-2 text-white disabled:opacity-50"
                        onclick={confirmReport}
                        disabled={reporting}
                    >
                        {reporting ? 'Reporting...' : 'Report'}
                    </button>
                </div>
            </div>
        </div>
    {/if}
</div>