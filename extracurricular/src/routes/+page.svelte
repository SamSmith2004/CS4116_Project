<script>
  import TopBar from '$lib/components/TopBar.svelte';

  let { data } = $props();

  const requests = $derived.by(() => data.requests ?? []);
  const recommendations = $derived.by(() => data.recommendations ?? []);
  const universityTintMap = $derived.by(() => data.universityTintMap ?? {});

  let requestIndex = $state(0);
  let recommendationIndex = $state(0);
  let searchQuery = $state('');
  let hasSearchActive = $state(false);

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

  const currentUniversityTint = $derived.by(() => {
    if (!currentMatch) return '#ffffff';
    return universityTintMap[currentMatch.university] ?? '#f8fafc';
  });

  const visibleMatch = $derived.by(() => currentMatch);

  const activePosition = $derived.by(() => {
    if (!visibleMatch) return 0;
    if (activeGroup === 'requests') return requestIndex + 1;
    if (activeGroup === 'recommendations') return recommendationIndex + 1;
    return 0;
  });

  const activeTotal = $derived.by(() => requests.length + recommendations.length);

  function handleSearch(query) {
    searchQuery = query.trim().toLowerCase();
  }

  function handleChoice() {
    if (!currentMatch) return;

    if (activeGroup === 'requests') {
      requestIndex = requestIndex + 1;
      return;
    }

    if (activeGroup === 'recommendations') {
      recommendationIndex = recommendationIndex + 1;
    }
  }

</script>

<TopBar placeholder="Search for people...." onSearch={handleSearch} />

<main class="min-h-[calc(100vh-3.5rem)] px-4 py-6 md:px-6 md:py-8 bg-linear-to-b from-slate-50 to-white">
  <div class="max-w-5xl mx-auto">
    <section>
      <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Matching Process</h1>
          <p class="text-sm text-gray-600 mt-1">Review profiles and pick who you want to connect with.</p>
        </div>
        <span class="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold tracking-wide text-gray-600 uppercase">
          {activePosition} / {activeTotal || 0}
        </span>
      </div>

      {#if !visibleMatch}
        <div class="rounded-3xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
          <h2 class="text-2xl font-bold text-gray-800">No profiles available</h2>
          <p class="text-gray-500 mt-2">Try clearing search or check back later for new recommendations.</p>
        </div>
      {:else}
        <article class="rounded-3xl border border-gray-200 shadow-md overflow-hidden transition-colors" style={`background-color: ${currentUniversityTint};`}>
          <div class="flex flex-col md:flex-row">
            <div class="md:w-2/5 shrink-0">
              <img
                src={visibleMatch.imageUrl}
                alt={`Profile picture of ${visibleMatch.name}`}
                class="w-full h-72 md:h-full object-cover"
              />
            </div>

            <div class="flex-1 flex flex-col justify-between p-6 sm:p-8">
              <div>
                <p class="inline-flex rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase mb-4 {activeGroup === 'requests' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'}">
                  {activeGroup === 'requests' ? 'Matched with You' : 'Recommendations'}
                </p>

                <div class="flex items-baseline gap-3">
                  <h2 class="text-left text-3xl font-bold text-gray-900 leading-tight">
                    {visibleMatch.name}
                  </h2>
                  <span class="text-xl text-gray-500">{visibleMatch.age}</span>
                </div>

                <dl class="mt-5 space-y-4 text-gray-700">
                  <div>
                    <dt class="text-xs uppercase tracking-widest text-gray-400">University</dt>
                    <dd class="text-base font-medium text-gray-900 mt-0.5">{visibleMatch.university}</dd>
                  </div>
                  <div>
                    <dt class="text-xs uppercase tracking-widest text-gray-400">Course</dt>
                    <dd class="text-base font-medium text-gray-900 mt-0.5">{visibleMatch.course}</dd>
                  </div>
                  <div>
                    <dt class="text-xs uppercase tracking-widest text-gray-400 mb-2">Interests</dt>
                    <dd class="flex flex-wrap gap-2">
                      {#each visibleMatch.interests.slice(0, 3) as interest}
                        <span class="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-sm font-medium">{interest}</span>
                      {/each}
                    </dd>
                  </div>
                </dl>

                <div class="mt-5">
                  <p class="text-xs uppercase tracking-widest text-gray-400">Bio</p>
                  <p class="text-sm text-gray-600 mt-1 leading-relaxed">{visibleMatch.bio}</p>
                </div>
              </div>

              <div class="mt-8 grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onclick={handleChoice}
                  disabled={!currentMatch}
                  class="w-full rounded-2xl px-5 py-4 text-lg font-semibold bg-red-50 text-red-700 border-2 border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Fail
                </button>

                <button
                  type="button"
                  onclick={handleChoice}
                  disabled={!currentMatch}
                  class="w-full rounded-2xl px-5 py-4 text-lg font-semibold bg-emerald-50 text-emerald-700 border-2 border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Pass
                </button>
              </div>

              {#if hasSearchActive}
                <p class="mt-3 text-xs text-gray-500">Search mode is active. Clear search to continue passing or failing profiles in order.</p>
              {/if}
            </div>
          </div>
        </article>
      {/if}
    </section>
  </div>
</main>
