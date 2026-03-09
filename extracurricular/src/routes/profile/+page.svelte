<script>
    import { enhance } from '$app/forms';
    let { data } = $props();

    let profile = $state({
        fname: data.user?.fname || '',
        lname: data.user?.lname || '',
        university: data.details?.university || '',
        degree: data.details?.degree || '',
        bio: data.details?.bio || '',
        selectedInterests: data.userInterests || [] 
    });

    const allInterests = data.allInterests || [];
</script>

<div class="flex flex-col min-h-screen bg-gray-50">
    <header class="grid grid-cols-3 items-center bg-white py-4 px-8 shadow-sm border-b border-gray-200">
        <div></div>
        <h1 class="text-center text-2xl font-bold text-gray-800 tracking-widest uppercase">My Profile</h1>
        <div class="flex justify-end">
            <button form="profile-form" class="bg-[#0C00BF] text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-blue-800 transition-colors">
                Save
            </button>
        </div>
    </header>

    <main class="p-8 max-w-6xl mx-auto w-full">
        <form id="profile-form" method="POST" action="?/updateProfile" use:enhance>
            <div class="flex flex-col md:flex-row gap-12">
                
                <div class="w-full md:w-1/3 flex flex-col items-center">
                    <div class="w-64 h-80 bg-white border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                        <span class="material-symbols-rounded text-gray-300 text-[96px]">account_circle</span>
                    </div>
                    
                    <div class="w-full">
                        <label class="block text-xs font-bold uppercase text-gray-500 mb-2 tracking-tight">Bio</label>
                        <textarea name="bio" bind:value={profile.bio} placeholder="Tell us more about you..." 
                            class="w-full border border-gray-300 rounded-xl p-3 text-sm h-32 resize-none outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                    </div>
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
                    </div>

                    <div class="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <label class="block text-xs font-bold uppercase text-gray-500 mb-4 tracking-tight">Interests</label>
                        <div class="flex flex-wrap gap-2">
                            {#each allInterests as interest}
                                <label class="group cursor-pointer">
                                    <input type="checkbox" name="interests" value={interest} 
                                        checked={profile.selectedInterests.includes(interest)} class="hidden peer" />
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