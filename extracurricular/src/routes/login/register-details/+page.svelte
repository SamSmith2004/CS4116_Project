<script>
    import { enhance } from '$app/forms';

    /** @type {import('./$types').PageProps} */
    let { form, data } = $props();

    const availableInterests = ['Hiking', 'Music', 'Gaming', 'Reading', 'Movies', 'Cycling', 'Sport', 'Swimming', 'Fishing', 'Computers'];
    let interests = $state([]);
    let allUniversities = $derived(data.allUniversities || []);
    let allDegrees = $derived(data.allDegrees || []);

    function toggleInterest(interest) {
        if (interests.includes(interest)) {
            interests = interests.filter((i) => i !== interest);
        } else {
            interests = [...interests, interest];
        }
    }
</script>

<div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div class="w-full max-w-md">

        <div class="text-center mb-8">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4 shadow-lg">
                <span class="material-symbols-rounded text-white text-[32px]">person_add</span>
            </div>
            <h1 class="text-2xl font-bold text-gray-900">Complete Your Profile</h1>
            <p class="text-gray-500 text-sm mt-1">Tell us a bit more about yourself</p>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <form method="post" action='?/signUpEmail' use:enhance class="space-y-4">

                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label for="fname" class="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                        <input
                            type="text"
                            id="fname"
                            name="fname"
                            required
                            placeholder="John"
                            class="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                        />
                    </div>
                    <div>
                        <label for="lname" class="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                        <input
                            type="text"
                            id="lname"
                            name="lname"
                            required
                            placeholder="Doe"
                            class="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                        />
                    </div>
                </div>

                <div>
                    <label for="uni" class="block text-sm font-medium text-gray-700 mb-1">University</label>
                    <select
                        id="uni"
                        name="uni"
                        required
                        class="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                    >
                        <option value="" disabled selected>Select your university</option>
                        {#each allUniversities as u}
                            <option value={u}>{u}</option>
                        {/each}
                    </select>
                </div>

                <div>
                    <label for="degree" class="block text-sm font-medium text-gray-700 mb-1">Degree</label>
                    <select
                        id="degree"
                        name="degree"
                        required
                        class="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                    >
                        <option value="" disabled selected>Select your degree</option>
                        {#each allDegrees as d}
                            <option value={d}>{d}</option>
                        {/each}
                    </select>
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label for="gender" class="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                        <select
                            id="gender"
                            name="gender"
                            required
                            class="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                        >
                            <option value="" disabled selected>Select gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label for="partnerPref" class="block text-sm font-medium text-gray-700 mb-1">Partner Preference</label>
                        <select
                            id="partnerPref"
                            name="partnerPref"
                            required
                            class="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                        >
                            <option value="" disabled selected>Select preference</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="both">Both</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Interests</label>
                    <div class="flex flex-wrap gap-2">
                        {#each availableInterests as interest}
                            <button
                                type="button"
                                onclick={() => toggleInterest(interest)}
                                class="px-3 py-1.5 rounded-full text-sm font-medium transition-all {interests.includes(interest) ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
                            >
                                {interest}
                            </button>
                        {/each}
                    </div>
                    {#each interests as interest}
                        <input type="hidden" name="interests" value={interest} />
                    {/each}
                    <p class="text-xs text-gray-400 mt-2">{interests.length} selected</p>
                </div>

                {#if form?.message}
                    <div class="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
                        <span class="material-symbols-rounded text-red-500 text-[18px]">error</span>
                        <p class="text-sm text-red-600">{form.message}</p>
                    </div>
                {/if}

                <button
                    type="submit"
                    class="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-sm mt-2"
                >
                    Create Account
                </button>
            </form>
        </div>
    </div>
</div>