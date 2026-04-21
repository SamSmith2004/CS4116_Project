<script>
    import { goto } from '$app/navigation';
    import ProfileReadonlyCard from '$lib/components/ProfileReadonlyCard.svelte';

    let { data } = $props();

    const profile = $derived(data.profile);

    function goBack() {
        if (window.history.length > 1) {
            window.history.back();
            return;
        }

        goto('/'); // fallback
    }
</script>

<div class="flex min-h-screen flex-col bg-gray-50">
    <header class="grid grid-cols-3 items-center border-b border-gray-200 bg-white px-8 py-4 shadow-sm">
        <div>
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
        <div></div>
    </header>

    <main class="mx-auto w-full max-w-6xl p-8">
        <ProfileReadonlyCard {profile} />
    </main>
</div>