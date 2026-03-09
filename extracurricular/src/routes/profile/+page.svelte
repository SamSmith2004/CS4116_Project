<script>
    import { enhance } from '$app/forms';
    let { data } = $props();

    // Reactive Initialisation // get all details from DB and if nothing then nothing...
    let profile = $state({
        fname: data.user?.fname || '',
        lname: data.user?.lname || '',
        university: data.details?.university || '',
        degree: data.details?.degree || '',
        gender: data.details?.gender || '',
        partnerPref: data.details?.partnerPref || '',
        interests: data.details?.bio || '',
        avatarUrl: data.details?.avatarUrl || ''
    });

    let fileInput;

    // preview of the avatar from the file
    function onFileSelected(e) {
        let image = e.target.files[0];
        if (image) {
            profile.avatarUrl = URL.createObjectURL(image); //in order to create a temporary img while it is not stroed yet
        }
    }
</script>

<div class="flex flex-col min-h-screen bg-gray-50">
    <header class="grid grid-cols-3 items-center bg-white py-4 px-8 shadow-sm border-b border-gray-200">
        <div></div> 
        <h1 class="text-center text-2xl font-bold text-gray-800 tracking-widest uppercase">
            My Profile
        </h1>
        <div class="flex justify-end">
            <button form="profile-form" class="bg-[#0C00BF] hover:bg-[#0a00a3] text-white px-6 py-2 rounded-full text-sm font-medium transition-transform active:scale-95">
                Save
            </button>
        </div>
    </header>

    <main class="p-8 max-w-6xl mx-auto w-full">
        <form id="profile-form" method="POST" action="?/updateProfile" use:enhance enctype="multipart/form-data">
            <input type="hidden" name="existingAvatarUrl" value={profile.avatarUrl} />
            
            <div class="flex flex-col md:flex-row gap-12">
                
                <div class="flex flex-col items-center w-full md:w-1/3">
                    <div class="w-64 h-80 bg-white border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center mb-6 shadow-inner overflow-hidden">
                        {#if profile.avatarUrl}
                            <img src={profile.avatarUrl} alt="Avatar" class="w-full h-full object-cover" />
                        {:else}
                            <span class="material-symbols-rounded text-gray-300 text-[96px]">account_circle</span>
                        {/if}
                    </div>
                    
                    <input type="file" name="avatar" class="hidden" bind:this={fileInput} accept="image/*" onchange={onFileSelected} />
                    <button type="button" onclick={() => fileInput.click()} class="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 rounded-full text-sm font-medium shadow-sm transition-colors">
                        Change my profile picture
                    </button>
                </div>

                <div class="w-full md:w-2/3">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <input type="text" name="fname" placeholder="Name" bind:value={profile.fname} class="border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                        <input type="text" name="lname" placeholder="Surname" bind:value={profile.lname} class="border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                        
                        <select name="gender" bind:value={profile.gender} class="border border-gray-300 rounded-lg p-2 text-sm bg-white outline-none">
                            <option value="" disabled selected>Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>

                        <input type="text" name="university" placeholder="University" bind:value={profile.university} class="border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                        <input type="text" name="degree" placeholder="Degree" bind:value={profile.degree} class="border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                        
                        <select name="partnerPref" bind:value={profile.partnerPref} class="border border-gray-300 rounded-lg p-2 text-sm bg-white outline-none">
                            <option value="" disabled selected>Partner Preference</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="both">Both</option>
                        </select>
                    </div>

                    <div class="relative">
                        <textarea name="interests" placeholder="Interests" bind:value={profile.interests} rows="8"
                            class="w-full border-2 border-gray-800 rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none shadow-sm">
                        </textarea>
                    </div>
                </div>
            </div>
        </form>
    </main>
</div>