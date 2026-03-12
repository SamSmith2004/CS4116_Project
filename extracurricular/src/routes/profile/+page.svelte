<script>
    import { enhance } from '$app/forms';
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

    // svelte-ignore state_referenced_locally
    let avatarPreview = $state(data.details?.avatarUrl || '');
    let avatarInput;

    function onAvatarChange(e) {
        const file = e.target.files?.[0];
        if (file) {
            avatarPreview = URL.createObjectURL(file);
        }
    }

    function handleSubmit() {
        return async ({ result }) => {
            if (result.type === 'success') {
                window.location.reload();
            } else if (result.type === 'error') {
                showToast(result.data?.message || 'Something went wrong.');
            }
        };
    }
</script>

<div class="flex flex-col min-h-screen bg-gray-50">
    <header class="grid grid-cols-3 items-center bg-white py-4 px-8 shadow-sm border-b border-gray-200">
        <div></div>
        <h1 class="text-center text-2xl font-bold text-gray-800 tracking-widest uppercase">Edit Profile</h1>
        <div class="flex justify-end">
            <button form="profile-form" class="bg-[#0C00BF] text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-blue-800 transition-colors">
                Save
            </button>
        </div>
    </header>

    <main class="p-8 max-w-6xl mx-auto w-full">
        <form id="profile-form" method="POST" action="?/updateProfile" enctype="multipart/form-data" use:enhance={handleSubmit}>
            <div class="flex flex-col md:flex-row gap-12">

                <div class="w-full md:w-1/3 flex flex-col items-center">
                    <button type="button" onclick={() => avatarInput.click()}
                        class="w-64 h-80 bg-white border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center mb-4 shadow-inner overflow-hidden hover:border-blue-400 transition-colors cursor-pointer relative group">
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
                    <input type="file" name="avatar" accept="image/jpeg,image/png,image/webp,image/gif"
                        bind:this={avatarInput} onchange={onAvatarChange} class="hidden" />
                </div>

                <div class="w-full md:w-2/3">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        <input type="text" name="fname" placeholder="Name" bind:value={profile.fname} class="border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                        <input type="text" name="lname" placeholder="Surname" bind:value={profile.lname} class="border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />

                        <select name="university" bind:value={profile.university} class="border border-gray-300 rounded-lg p-2 text-sm bg-white outline-none">
                            <option value="" disabled>Select University</option>
                            <option value="University of Limerick">University of Limerick</option>
                        </select>

                        <select name="degree" bind:value={profile.degree} class="border border-gray-300 rounded-lg p-2 text-sm bg-white outline-none">
                            <option value="" disabled>Select Degree</option>
                            <option value="Computer Science">Computer Science</option>
                        </select>

                        <select name="gender" bind:value={profile.gender} class="border border-gray-300 rounded-lg p-2 text-sm bg-white outline-none">
                            <option value="" disabled>Select Gender</option>
                            {#each allGenders as g}
                                <option value={g}>{g[0].toUpperCase() + g.slice(1)}</option>
                            {/each}
                        </select>

                        <select name="partnerPref" bind:value={profile.partnerPref} class="border border-gray-300 rounded-lg p-2 text-sm bg-white outline-none">
                            <option value="" disabled>Partner Preference</option>
                            {#each allPartnerPrefs as p}
                                <option value={p}>{p[0].toUpperCase() + p.slice(1)}</option>
                            {/each}
                        </select>
                    </div>

                    <div class="mb-6">
                        <label for="bio" class="block text-xs font-bold uppercase text-gray-500 mb-2 tracking-tight">Bio</label>
                        <textarea id="bio" name="bio" bind:value={profile.bio} placeholder="Tell us more about you..."
                            class="w-full border border-gray-300 rounded-xl p-4 text-sm h-48 resize-none outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                    </div>

                    <div class="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <span class="block text-xs font-bold uppercase text-gray-500 mb-4 tracking-tight">Interests</span>
                        <div class="flex flex-wrap gap-2">
                            {#each allInterests as interest}
                                <label class="group cursor-pointer">
                                    <input type="checkbox" name="interests" value={interest}
                                        bind:group={profile.selectedInterests} class="hidden peer" />
                                    <span class="px-4 py-2 rounded-full border border-gray-300 text-sm block transition-all
                                        peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-600">
                                        {interest}
                                    </span>
                                </label>
                            {/each}
                        </div>
                    </div>
                </div>
            </div>
        </form>
    </main>
</div>
