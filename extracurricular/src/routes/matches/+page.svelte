<script>
    let { data } = $props();
    const requests = $derived.by(() => data.requests ?? []);
    const currentMatches = $derived.by(() => data.currentMatches ?? []);
    const decisionHistory = $derived.by(() => data.decisionHistory ?? []);
    let hidePendingPanels = $state(false);
    let expandedMatchId = $state(null);

    const currentMatch = $derived.by(() => {
        return requests[0] ?? null;
    });

    const universityTintMap = $derived.by(() => data.universityTintMap ?? {});

    const currentUniversityTint = $derived.by(() => {
        if (!currentMatch) return '#ffffff';
        return universityTintMap[currentMatch.university] ?? '#f8fafc';
    });

    function getUniversityTint(profile) {
        if (!profile?.university) return '#f8fafc';
        return universityTintMap[profile.university] ?? '#f8fafc';
    }

    const showPendingPanels = $derived.by(() => {
        return !hidePendingPanels || !!currentMatch;
    });

</script>

<main class="min-h-[calc(100vh-3.5rem)] bg-transparent px-4 py-8 md:px-6 md:py-10">
    <div class="max-w-6xl mx-auto">
        <h1 class="text-center text-3xl font-bold text-gray-900">Matches</h1>
        <p class="text-center text-gray-600 mt-2 mb-8">Review people who have sent you match requests.</p>

        <div
            class={`grid grid-cols-1 gap-6 items-start ${showPendingPanels ? 'xl:grid-cols-[1fr_320px]' : 'xl:grid-cols-1'}`}
        >
            <div>
                {#if showPendingPanels}
                    {#if !currentMatch}
                        <div class="rounded-3xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
                            <h2 class="text-2xl font-bold text-gray-800">No more pending matches</h2>
                            <p class="text-gray-500 mt-2">You have reviewed everyone who matched with you.</p>
                            <button
                                type="button"
                                onclick={() => (hidePendingPanels = true)}
                                class="mt-6 rounded-xl px-5 py-2.5 text-sm font-semibold bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200 transition-colors"
                            >
                                Dismiss
                            </button>
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
                                        <p class="inline-flex rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase mb-4 bg-amber-100 text-amber-700">
                                            Matched with You
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
                                        <form method="POST" action="?/decide">
                                            <input type="hidden" name="requestId" value={currentMatch.id} />
                                            <input type="hidden" name="decision" value="fail" />
                                            <button
                                                type="submit"
                                                class="w-full rounded-2xl px-5 py-4 text-lg font-semibold bg-red-50 text-red-700 border-2 border-red-200 hover:bg-red-100 transition-colors"
                                            >
                                                Fail
                                            </button>
                                        </form>

                                        <form method="POST" action="?/decide">
                                            <input type="hidden" name="requestId" value={currentMatch.id} />
                                            <input type="hidden" name="decision" value="pass" />
                                            <button
                                                type="submit"
                                                class="w-full rounded-2xl px-5 py-4 text-lg font-semibold bg-emerald-50 text-emerald-700 border-2 border-emerald-200 hover:bg-emerald-100 transition-colors"
                                            >
                                                Pass
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </article>
                    {/if}
                {/if}

                <section class="rounded-2xl border border-gray-200 bg-white shadow-sm p-5 {showPendingPanels ? 'mt-6' : ''}">
                    <h3 class="text-xl font-semibold text-gray-900">Your Connections</h3>
                    <p class="text-sm text-gray-500 mt-1">People you have matched with. Send one a message!</p>

                    {#if currentMatches.length === 0}
                        <p class="text-sm text-gray-400 mt-4">No current matches yet.</p>
                    {:else}
                        <ul class="mt-4 space-y-3">
                            {#each currentMatches as match (match.id)}
                                <li class="rounded-xl border border-gray-200 p-3">
                                    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div class="flex items-center gap-3 min-w-0 md:flex-1">
                                            <img
                                                src={match.imageUrl}
                                                alt={match.name}
                                                class="w-12 h-12 rounded-full object-cover border border-gray-200 shrink-0"
                                            />
                                            <div class="min-w-0">
                                                <p class="text-sm font-semibold text-gray-900 truncate">{match.name}, {match.age}</p>
                                                <p class="text-xs text-gray-500 truncate">{match.university}</p>
                                                <p class="text-xs text-gray-500 truncate">{match.course}</p>
                                            </div>
                                        </div>

                                        <div class="md:flex-1 flex justify-center">
                                            <button
                                                type="button"
                                                onclick={() => (expandedMatchId = expandedMatchId === match.id ? null : match.id)}
                                                class="rounded-lg px-3 py-2 text-sm font-semibold bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200 transition-colors"
                                            >
                                                {expandedMatchId === match.id ? 'Hide Details' : 'View More'}
                                            </button>
                                        </div>

                                        <div class="flex items-center gap-2 shrink-0 md:flex-1 md:justify-end">
                                            <form method="POST" action="?/startConversation">
                                                <input type="hidden" name="matchId" value={match.id} />
                                                <button
                                                    type="submit"
                                                    class="rounded-lg px-3 py-2 text-sm font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                                                >
                                                    Message
                                                </button>
                                            </form>

                                            <form method="POST" action="?/unmatch">
                                                <input type="hidden" name="matchId" value={match.id} />
                                                <button
                                                    type="submit"
                                                    class="rounded-lg px-3 py-2 text-sm font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors"
                                                >
                                                    Unmatch
                                                </button>
                                            </form>
                                        </div>
                                    </div>

                                    {#if expandedMatchId === match.id}
                                        <div
                                            class="mt-4 rounded-xl border border-gray-200 p-4"
                                            style={`background-color: ${getUniversityTint(match)};`}
                                        >
                                            <div class="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-4">
                                                <img
                                                    src={match.imageUrl}
                                                    alt={`Profile picture of ${match.name}`}
                                                    class="w-full h-28 md:h-full rounded-lg object-cover border border-gray-200"
                                                />

                                                <div>
                                                    <h4 class="text-lg font-semibold text-gray-900">{match.name}</h4>
                                                    <p class="text-sm text-gray-600 mt-1">{match.bio}</p>

                                                    <div class="mt-3 flex flex-wrap gap-2">
                                                        {#each match.interests ?? [] as interest}
                                                            <span class="px-2.5 py-1 rounded-full bg-white border border-gray-200 text-xs font-medium text-gray-700">
                                                                {interest}
                                                            </span>
                                                        {/each}
                                                    </div>

                                                    {#if match.profileDetails}
                                                        <div class="mt-4 space-y-2 text-sm text-gray-700">
                                                            <p><span class="font-semibold">Ideal weekend:</span> {match.profileDetails.idealWeekend}</p>
                                                            <p><span class="font-semibold">Looking for:</span> {match.profileDetails.lookingFor}</p>
                                                            <p><span class="font-semibold">Societies:</span> {(match.profileDetails.societies ?? []).join(', ')}</p>
                                                        </div>
                                                    {/if}
                                                </div>
                                            </div>
                                        </div>
                                    {/if}
                                </li>
                            {/each}
                        </ul>
                    {/if}
                </section>
            </div>

            {#if showPendingPanels}
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
            {/if}
        </div>
    </div>
</main>