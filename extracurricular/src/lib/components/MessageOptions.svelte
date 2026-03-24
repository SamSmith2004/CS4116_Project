<script>
    import { createEventDispatcher } from 'svelte';

    export let open = false;
    export let x = 0;
    export let y = 0;

    const dispatch = createEventDispatcher();
    function onDelete() { dispatch('delete'); }
    function onReport() { dispatch('report'); }
    function onClose() { dispatch('close'); }
</script>

{#if open}
    <button
        type="button"
        class="fixed inset-0 z-40 bg-transparent"
        onclick={onClose}
        aria-label="Close message options"
    ></button>

    <div
        class="fixed z-50 bg-white rounded-lg shadow-lg p-2 min-w-40 flex flex-col gap-2"
        role="dialog"
        aria-modal="true"
        tabindex="0"
        onkeydown={(e) => { if (e.key === 'Escape') onClose(); }}
        style="left: {x}px; top: {y}px; transform: translate(-50%, -110%);"
    >
        <button
            type="button"
            class="py-2 px-3 text-left w-full text-sm rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-red-600"
            onclick={onDelete}
            aria-label="Delete message"
        >
            Delete
        </button>

        <button
            type="button"
            class="py-2 px-3 text-left w-full text-sm rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-orange-600"
            onclick={onReport}
            aria-label="Report message"
        >
            Report
        </button>
    </div>
{/if}
