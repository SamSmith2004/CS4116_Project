<script>
    import { getToast, dismissToast } from '$lib/toast.svelte.js';

    let toast = $derived(getToast());
</script>

{#if toast.show}
    <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
        <div class="flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-medium
            {toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}">
            <span class="material-symbols-rounded text-[20px]">
                {toast.type === 'error' ? 'error' : 'check_circle'}
            </span>
            {toast.message}
            <button onclick={dismissToast} class="ml-2 hover:opacity-80">
                <span class="material-symbols-rounded text-[18px]">close</span>
            </button>
        </div>
    </div>
{/if}

<style>
    @keyframes slide-up {
        from { transform: translateX(-50%) translateY(100%); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
    }
    :global(.animate-slide-up) {
        animation: slide-up 0.3s ease-out;
    }
</style>
