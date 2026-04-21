<script>
    import { goto } from '$app/navigation';
    import ProfileReadonlyCard from '$lib/components/ProfileReadonlyCard.svelte';
    let { data } = $props();

    function calculateAge(dob) {
        if (!dob) return '';
        const diff = Date.now() - new Date(dob).getTime();
        return Math.abs(new Date(diff).getUTCFullYear() - 1970);
    }

    const previewProfile = $derived({
        name: `${data.user?.fname || ''} ${data.user?.lname || ''}`.trim() || data.user?.name || 'Unknown User',
        age: calculateAge(data.user?.dob),
        university: data.details?.university || '',
        degree: data.details?.degree || '',
        bio: data.details?.bio || '',
        avatarUrl: data.details?.avatarUrl || '',
        gender: data.details?.gender || '',
        partnerPref: data.details?.partnerPref || '',
        interests: data.userInterests || []
    });
</script>

<div class="flex flex-col min-h-screen">
    <header class="border-b border-gray-200 bg-white px-4 py-4 shadow-sm md:px-8">
        <div class="flex flex-col gap-3 md:grid md:grid-cols-3 md:items-center">
        <div class="hidden md:block"></div>
        <h1 class="text-center text-2xl font-bold text-gray-800 tracking-widest uppercase">Profile</h1>
        <div class="flex flex-wrap justify-center gap-2 md:justify-end md:gap-3">
            <button onclick={() => void goto('/profile/edit')} class="rounded-full bg-gray-100 px-5 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 md:px-6">
                Modify
            </button>
        </div>
        </div>
    </header>

    <main class="p-4 md:p-8 max-w-6xl mx-auto w-full">
        <div class="rounded-3xl border border-gray-200/80 bg-white/85 shadow-xl backdrop-blur-md p-6 md:p-8">
            <ProfileReadonlyCard profile={previewProfile} />
        </div>
    </main>
</div>
