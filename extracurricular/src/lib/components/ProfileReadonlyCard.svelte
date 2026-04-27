<script>
    let { profile } = $props();
    const defaultAvatarUrl = '/images/tempAvatar.png';

    function toTitleCase(value) {
        if (!value) return 'Not specified';
        return value[0].toUpperCase() + value.slice(1);
    }
</script>

<div class="flex flex-col gap-12 md:flex-row">
    <aside class="flex w-full flex-col items-center md:w-1/3">
        <div class="mb-4 flex h-80 w-64 items-center justify-center overflow-hidden rounded-2xl border-2 border-gray-200 bg-white shadow-inner">
            <img
                src={profile.avatarUrl || defaultAvatarUrl}
                alt={`Avatar of ${profile.name}`}
                class="h-full w-full object-cover"
            />
        </div>

        <h2 class="text-center text-2xl font-bold text-gray-900">{profile.name}</h2>
        {#if profile.age !== null && profile.age !== ''}
            <p class="mt-1 text-sm font-medium text-gray-500">{profile.age} years old</p>
        {/if}
    </aside>

    <section class="w-full md:w-2/3">
        <div class="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
                <p class="mb-1 block text-xs font-bold uppercase text-gray-500">University</p>
                <p class="rounded-lg p-2 text-sm font-semibold text-gray-900">{profile.university || 'Not specified'}</p>
            </div>

            <div>
                <p class="mb-1 block text-xs font-bold uppercase text-gray-500">Degree</p>
                <p class="rounded-lg p-2 text-sm font-semibold text-gray-900">{profile.degree || 'Not specified'}</p>
            </div>

            <div>
                <p class="mb-1 block text-xs font-bold uppercase text-gray-500">Gender</p>
                <p class="rounded-lg p-2 text-sm font-semibold text-gray-900">{toTitleCase(profile.gender)}</p>
            </div>

            <div>
                <p class="mb-1 block text-xs font-bold uppercase text-gray-500">Partner Preference</p>
                <p class="rounded-lg p-2 text-sm font-semibold text-gray-900">{toTitleCase(profile.partnerPref)}</p>
            </div>
        </div>

        <div class="mb-6">
            <p class="mb-2 block text-xs font-bold uppercase tracking-tight text-gray-400">Bio</p>
            <div class="w-full rounded-xl bg-white p-4 text-sm leading-relaxed text-gray-700 shadow-sm">
                {profile.bio || 'No bio provided.'}
            </div>
        </div>

        <div>
            <p class="mb-2 block text-xs font-bold uppercase tracking-tight text-gray-400">Interests</p>
            <div class="flex flex-wrap gap-2">
                {#if profile.interests.length > 0}
                    {#each profile.interests as interest}
                        <span class="rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
                            {interest}
                        </span>
                    {/each}
                {:else}
                    <p class="rounded-xl bg-white p-3 text-sm text-gray-500 shadow-sm">No interests selected.</p>
                {/if}
            </div>
        </div>
    </section>
</div>