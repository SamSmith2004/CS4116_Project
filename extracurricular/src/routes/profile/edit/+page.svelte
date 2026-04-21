<script>
    import { enhance } from '$app/forms';
    import { goto } from '$app/navigation';
    import { showToast } from '$lib/toast.svelte.js';

    let { data } = $props();

    // svelte-ignore state_referenced_locally
    let profile = $state({
        fname: data.user?.fname || '',
        lname: data.user?.lname || '',
        university: data.details?.university || '',
        degree: data.details?.degree || '',
        bio: data.details?.bio || '',
        gender: data.details?.gender || '',
        partnerPref: data.details?.partnerPref || '',
        selectedInterests: data.userInterests || []
    });

    let allInterests = $derived(data.allInterests || []);
    let allGenders = $derived(data.allGenders || []);
    let allPartnerPrefs = $derived(data.allPartnerPrefs || []);
    let allUniversities = $derived(data.allUniversities || []);
    let allDegrees = $derived(data.allDegrees || []);

    // svelte-ignore state_referenced_locally
    let avatarPreview = $state(data.details?.avatarUrl || '');
    let avatarInput = $state();

    function onAvatarChange(e) {
        const file = e.target.files?.[0];
        if (file) {
            avatarPreview = URL.createObjectURL(file);
        }
    }

    function handleSubmit() {
        return async ({ result }) => {
            if (result.type === 'success') {
                await goto('/profile/');
                showToast('Profile updated', 'sucess');
            } else if (result.type === 'error') {
                showToast(result.data?.message || 'Something went wrong.');
            }
        };
    }
</script>

<div class="flex flex-col min-h-screen">
    <header class="border-b border-gray-200 bg-white px-4 py-4 shadow-sm md:px-8">
        <div class="flex flex-col gap-3 md:grid md:grid-cols-3 md:items-center">
            <div class="hidden md:block"></div>
            <h1 class="text-center text-2xl font-bold text-gray-800 tracking-widest uppercase">Edit Profile</h1>
            <div class="flex flex-wrap justify-center gap-2 md:justify-end md:gap-3">
                <button onclick={() => void goto('/profile/')} class="px-4 py-2 text-sm font-medium text-gray-500">
                    Cancel
                </button>
                <button form="profile-form" class="rounded-full bg-[#0C00BF] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800 md:px-6">
                    Save
                </button>
            </div>
        </div>
    </header>

    <main class="p-4 md:p-8 max-w-6xl mx-auto w-full">
        <div class="rounded-3xl border border-gray-200/80 bg-white/85 shadow-xl backdrop-blur-md p-6 md:p-8">
            <form id="profile-form" method="POST" action="?/updateProfile" enctype="multipart/form-data" use:enhance={handleSubmit}>
                <div class="flex flex-col md:flex-row gap-12">
                    <div class="w-full md:w-1/3 flex flex-col items-center">
                        <button
                            type="button"
                            onclick={() => avatarInput.click()}
                            class="w-64 h-80 bg-white border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center mb-4 shadow-inner overflow-hidden hover:border-blue-400 transition-colors cursor-pointer relative group"
                        >
                            {#if avatarPreview}
                                <img src={avatarPreview} alt="Avatar" class="w-full h-full object-cover" />
                                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span class="material-symbols-rounded text-white text-[48px]">photo_camera</span>
                                </div>
                            {:else}
                                <div class="flex flex-col items-center gap-2">
                                    <span class="material-symbols-rounded text-gray-300 text-[96px]">account_circle</span>
                                    <span class="text-xs text-gray-400 font-medium">Click to upload</span>
                                </div>
                            {/if}
                        </button>
                        <input
                            type="file"
                            name="avatar"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            bind:this={avatarInput}
                            onchange={onAvatarChange}
                            class="hidden"
                        />
                    </div>

                    <div class="w-full md:w-2/3">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                            <div>
                                <p class="block text-xs font-bold uppercase text-gray-400 mb-1">First Name</p>
                                <input type="text" name="fname" bind:value={profile.fname} class="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>

                            <div>
                                <p class="block text-xs font-bold uppercase text-gray-400 mb-1">Last Name</p>
                                <input type="text" name="lname" bind:value={profile.lname} class="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>

                            <div>
                                <p class="block text-xs font-bold uppercase text-gray-500 mb-1">University</p>
                                <select id="university" name="university" bind:value={profile.university} class="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white outline-none">
                                    <option value="" disabled>Select University</option>
                                    {#each allUniversities as u}
                                        <option value={u}>{u}</option>
                                    {/each}
                                </select>
                            </div>

                            <div>
                                <p class="block text-xs font-bold uppercase text-gray-500 mb-1">Degree</p>
                                <select id="degree" name="degree" bind:value={profile.degree} class="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white outline-none">
                                    <option value="" disabled>Select Degree</option>
                                    {#each allDegrees as d}
                                        <option value={d}>{d}</option>
                                    {/each}
                                </select>
                            </div>

                            <div>
                                <p class="block text-xs font-bold uppercase text-gray-500 mb-1">Gender</p>
                                <select id="gender" name="gender" bind:value={profile.gender} class="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white outline-none">
                                    <option value="" disabled>Select Gender</option>
                                    {#each allGenders as g}
                                        <option value={g}>{g[0].toUpperCase() + g.slice(1)}</option>
                                    {/each}
                                </select>
                            </div>

                            <div>
                                <p class="block text-xs font-bold uppercase text-gray-500 mb-1">Partner Preference</p>
                                <select id="partnerPref" name="partnerPref" bind:value={profile.partnerPref} class="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white outline-none">
                                    <option value="" disabled>Partner Preference</option>
                                    {#each allPartnerPrefs as p}
                                        <option value={p}>{p[0].toUpperCase() + p.slice(1)}</option>
                                    {/each}
                                </select>
                            </div>
                        </div>

                        <div class="mb-6">
                            <p class="block text-xs font-bold uppercase text-gray-400 mb-2 tracking-tight">Bio</p>
                            <textarea name="bio" bind:value={profile.bio} class="w-full border border-gray-300 rounded-xl p-4 text-sm h-48 resize-none outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                        </div>

                        <div>
                            <p class="block text-xs font-bold uppercase text-gray-400 mb-2 tracking-tight">Interests</p>
                            <div class="flex flex-wrap gap-2">
                            {#each allInterests as interest}
                                <label class="group cursor-pointer">
                                    <input type="checkbox" name="interests" value={interest} bind:group={profile.selectedInterests} class="hidden peer" />
                                    <span class="px-4 py-2 rounded-full border border-gray-300 text-sm block transition-all peer-checked:bg-blue-600 peer-checked:text-white">
                                        {interest}
                                    </span>
                                </label>
                            {/each}
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    </main>
</div>
