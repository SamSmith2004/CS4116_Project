<script>
    import TopBar from '$lib/components/TopBar.svelte';
    let { data } = $props();
    const requests = $derived.by(() => data.requests ?? []);
    const recommendations = $derived.by(() => data.recommendations ?? []);

    let requestIndex = $state(0);
    let recommendationIndex = $state(0);
    let decisionHistory = $state([]);

    const activeGroup = $derived.by(() => {
        if (requestIndex < requests.length) return 'requests';
        if (recommendationIndex < recommendations.length) return 'recommendations';
        return 'done';
    });

    const currentMatch = $derived.by(() => {
        if (activeGroup === 'requests') return requests[requestIndex];
        if (activeGroup === 'recommendations') return recommendations[recommendationIndex];
        return null;
    });

    const activePosition = $derived.by(() => {
        if (activeGroup === 'requests') return requestIndex + 1;
        if (activeGroup === 'recommendations') return recommendationIndex + 1;
        return 0;
    });

    const activeTotal = $derived.by(() => {
        if (activeGroup === 'requests') return requests.length;
        if (activeGroup === 'recommendations') return recommendations.length;
        return 0;
    });

    const universityTintMap = $derived.by(() => data.universityTintMap ?? {});

    const currentUniversityTint = $derived.by(() => {
        if (!currentMatch) return '#ffffff';
        return universityTintMap[currentMatch.university] ?? '#f8fafc';
    });

    function handleChoice(choice) {
        if (!currentMatch) return;

        const selectedMatch = currentMatch;

        decisionHistory = [
            {
                id: selectedMatch.id,
                name: selectedMatch.name,
                age: selectedMatch.age,
                course: selectedMatch.course,
                bio: selectedMatch.bio,
                imageUrl: selectedMatch.imageUrl,
                decision: choice,
                source: activeGroup
            },
            ...decisionHistory
        ];

        console.log('match-decision', {
            matchId: selectedMatch.id,
            source: activeGroup,
            decision: choice
        });

        if (activeGroup === 'requests') {
            requestIndex = requestIndex + 1;
            return;
        }

        if (activeGroup === 'recommendations') {
            recommendationIndex = recommendationIndex + 1;
        }
    }
</script>

<main class="min-h-[calc(100vh-3.5rem)] px-4 py-8 md:px-6 md:py-10 bg-gradient-to-b from-slate-50 to-white">
    <div class="max-w-6xl mx-auto">
        <h1 class="text-center text-3xl font-bold text-gray-900">Matches</h1>
        <p class="text-center text-gray-600 mt-2 mb-8">Requests are reviewed first. Recommendations appear after all requests are handled.</p>

        <div class="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start">
            <div>
                {#if activeGroup === 'done'}
                    <div class="rounded-3xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
                        <h2 class="text-2xl font-bold text-gray-800">No more matches</h2>
                        <p class="text-gray-500 mt-2">You have reviewed all requests and recommendations.</p>
                    </div>
                {:else}
                    <article
                        class="rounded-3xl border border-gray-200 shadow-md overflow-hidden transition-colors"
                        style={`background-color: ${currentUniversityTint};`}
                    >
                        <div class="flex flex-col sm:flex-row">
                            <div class="sm:w-2/5 shrink-0">
                                <img
                                    src={currentMatch.imageUrl}
                                    alt={`Profile picture of ${currentMatch.name}`}
                                    class="w-full h-72 sm:h-full object-cover"
                                />
                            </div>

                            <div class="flex-1 flex flex-col justify-between p-6 sm:p-8">
                                <div>
                                    <p class="inline-flex rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase mb-4 {activeGroup === 'requests' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'}">
                                        {activeGroup === 'requests' ? 'Matched with You' : 'Recommendations'}
                                    </p>

                                    <div class="flex items-baseline gap-3">
                                        <h2 class="text-3xl font-bold text-gray-900 leading-tight">{currentMatch.name}</h2>
                                        <span class="text-xl text-gray-500">{currentMatch.age}</span>
                                    </div>

                                    <dl class="mt-5 space-y-4 text-gray-700">
                                        <div>
                                            <dt class="text-xs uppercase tracking-widest text-gray-400">University</dt>
                                            <dd class="text-base font-medium text-gray-900 mt-0.5">{currentMatch.university}</dd>
                                        </div>
                                        <div>
                                            <dt class="text-xs uppercase tracking-widest text-gray-400">Course</dt>
                                            <dd class="text-base font-medium text-gray-900 mt-0.5">{currentMatch.course}</dd>
                                        </div>
                                        <div>
                                            <dt class="text-xs uppercase tracking-widest text-gray-400 mb-2">Interests</dt>
                                            <dd class="flex flex-wrap gap-2">
                                                {#each currentMatch.interests as interest}
                                                    <span class="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-sm font-medium">
                                                        {interest}
                                                    </span>
                                                {/each}
                                            </dd>
                                        </div>
                                    </dl>

                                    <div class="mt-5">
                                        <p class="text-xs uppercase tracking-widest text-gray-400">Bio</p>
                                        <p class="text-sm text-gray-600 mt-1 leading-relaxed">
                                            {currentMatch.bio}
                                        </p>
                                    </div>
                                </div>

                                <div class="mt-8 grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onclick={() => handleChoice('fail')}
                                        class="w-full rounded-2xl px-5 py-4 text-lg font-semibold bg-red-50 text-red-700 border-2 border-red-200 hover:bg-red-100 transition-colors"
                                    >
                                        Fail
                                    </button>

                                    <button
                                        type="button"
                                        onclick={() => handleChoice('pass')}
                                        class="w-full rounded-2xl px-5 py-4 text-lg font-semibold bg-emerald-50 text-emerald-700 border-2 border-emerald-200 hover:bg-emerald-100 transition-colors"
                                    >
                                        Pass
                                    </button>
                                </div>
                            </div>
                        </div>
                    </article>
                {/if}
            </div>

            <aside class="rounded-2xl border border-gray-200 bg-white shadow-sm p-4">
                <h3 class="text-lg font-semibold text-gray-900">History</h3>
                <p class="text-sm text-gray-500 mt-1">Recent decisions</p>

                {#if decisionHistory.length === 0}
                    <p class="text-sm text-gray-400 mt-6">No profiles reviewed yet.</p>
                {:else}
                    <ul class="mt-4 space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                        {#each decisionHistory as item (item.id)}
                            <li class="flex items-center gap-3 rounded-xl border border-gray-200 p-3">
                                <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    class="w-12 h-12 rounded-full object-cover border border-gray-200 shrink-0"
                                />
                                <div class="min-w-0 flex-1">
                                    <p class="text-sm font-semibold text-gray-900 truncate">{item.name}, {item.age}</p>
                                    <p class="text-xs text-gray-500 truncate">{item.course}</p>
                                    <p class="text-xs text-gray-500 mt-1 line-clamp-2">{item.bio}</p>
                                </div>
                                <span class="text-xs font-semibold uppercase tracking-wide px-2 py-1 rounded-full {item.decision === 'pass' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}">
                                    {item.decision}
                                </span>
                            </li>
                        {/each}
                    </ul>
                {/if}
            </aside>
        </div>
    </div>
</main>