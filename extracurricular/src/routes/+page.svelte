<script>
  import { tick } from 'svelte';
  import { showToast } from '$lib/toast.svelte.js';

  let { data } = $props();

  const requests = $derived.by(() => data.requests ?? []);
  const recommendations = $derived.by(() => data.recommendations ?? []);
  const universityTintMap = $derived.by(() => data.universityTintMap ?? {});
  const universityOptions = $derived.by(() => data.universityList ?? []);
  const degreeOptions = $derived.by(() => data.degreeList ?? []);
  const interestOptions = $derived.by(() => data.interestList ?? []);

  let requestIndex = $state(0);
  let recommendationIndex = $state(0);
  let searchIndex = $state(0);
  let searchQuery = $state('');
  let searchResults = $state([]);
  let hasSearchActive = $state(false);
  let showFilterModal = $state(false);

  let selectedUniversity = $state('');
  let selectedDegree = $state('');
  let selectedInterests = $state([]);
  let minAge = $state('');
  let maxAge = $state('');
  let sortBy = $state('none');
  let modalSearchInput = $state();

  const hasAppliedFilters = $derived.by(() => Boolean(
    selectedUniversity ||
    selectedDegree ||
    minAge ||
    maxAge ||
    (selectedInterests?.length ?? 0) > 0 ||
    sortBy !== 'none'
  ));

  const activeGroup = $derived.by(() => {
    if (hasSearchActive && searchIndex < searchResults.length) return 'search';
    if (hasSearchActive) return 'done';
    if (requestIndex < requests.length) return 'requests';
    if (recommendationIndex < recommendations.length) return 'recommendations';
    return 'done';
  });

  const currentMatch = $derived.by(() => {
    if (hasSearchActive) return searchResults[searchIndex] ?? null;
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
    if (hasSearchActive) return searchIndex + 1;
    if (activeGroup === 'requests') return requestIndex + 1;
    if (activeGroup === 'recommendations') return recommendationIndex + 1;
    return 0;
  });

  const activeTotal = $derived.by(() => {
    if (hasSearchActive) return searchResults.length;
    return requests.length + recommendations.length;
  });

  async function executeSearch() {
    const hasAnyFilter = Boolean(
      searchQuery ||
      selectedUniversity ||
      selectedDegree ||
      minAge ||
      maxAge ||
      (selectedInterests?.length ?? 0) > 0 ||
      sortBy !== 'none'
    );

    if (!hasAnyFilter) {
      hasSearchActive = false;
      searchResults = [];
      searchIndex = 0;
      return;
    }

    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedUniversity) params.set('university', selectedUniversity);
    if (selectedDegree) params.set('degree', selectedDegree);
    if (minAge) params.set('minAge', minAge);
    if (maxAge) params.set('maxAge', maxAge);
    if ((selectedInterests?.length ?? 0) > 0) params.set('interests', selectedInterests.join(','));
    params.set('sort', sortBy);

    const response = await fetch(`/api/users/search?${params.toString()}`);
    const result = await response.json();

    if (!response.ok) {
      if (response.status === 400) {
        minAge = '';
        maxAge = '';
        hasSearchActive = false;
        searchResults = [];
        searchIndex = 0;
        showFilterModal = false;
        showToast(result?.error || 'Invalid age filter', 'error');
        return;
      }

      hasSearchActive = true;
      searchResults = [];
      searchIndex = 0;

      return;
    }

    searchResults = result.users ?? [];
    hasSearchActive = true;
    searchIndex = 0;
  }

  async function handleSearchSubmit(event) {
    event.preventDefault();
    searchQuery = searchQuery.trim();
    await executeSearch();
    showFilterModal = false;
  }

  async function openFilterModal() {
    showFilterModal = true;
    await tick();
    modalSearchInput?.focus();
  }

  function closeFilterModal() {
    showFilterModal = false;
  }

  async function applyFilters() {
    await executeSearch();
    showFilterModal = false;
  }

  function resetFilters() {
    searchQuery = '';
    selectedUniversity = '';
    selectedDegree = '';
    selectedInterests = [];
    minAge = '';
    maxAge = '';
    sortBy = 'none';
    searchResults = [];
    searchIndex = 0;
    hasSearchActive = false;
    showFilterModal = false;
  }

  function handleChoice() {
    if (!currentMatch) return;

    if (hasSearchActive) {
      searchIndex = searchIndex + 1;
      return;
    }

    if (activeGroup === 'requests') {
      requestIndex = requestIndex + 1;
      return;
    }

    if (activeGroup === 'recommendations') {
      recommendationIndex = recommendationIndex + 1;
    }
  }

</script>

<header class="sticky top-0 z-40 w-full bg-white border-b border-gray-200 shadow-sm">
  <div class="flex items-center justify-center px-6 min-h-14 py-2">
    <div class="w-full max-w-lg">
      <div class="relative flex items-center">
        <span class="material-symbols-rounded absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px] pointer-events-none">
          search
        </span>
        <input
          type="text"
          value={searchQuery}
          readonly
          tabindex="-1"
          inputmode="none"
          onpointerdown={(event) => event.preventDefault()}
          onclick={openFilterModal}
          placeholder="Search for people...."
          class="w-full pl-10 pr-18 py-2 rounded-xl border border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-400 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none focus:bg-white transition cursor-pointer"
        />

        {#if hasAppliedFilters}
          <span class="material-symbols-rounded absolute right-10 top-1/2 -translate-y-1/2 text-blue-600 text-[18px]" title="Filters active">
            filter_alt
          </span>
        {/if}

        {#if searchQuery || hasAppliedFilters || hasSearchActive}
          <button
            type="button"
            onclick={resetFilters}
            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span class="material-symbols-rounded text-[18px]">close</span>
          </button>
        {/if}
      </div>
    </div>
  </div>
</header>

{#if showFilterModal}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    onkeydown={(event) => event.key === 'Escape' && closeFilterModal()}
  >
    <button
      type="button"
      class="absolute inset-0 bg-black/45"
      aria-label="Close search filters"
      onclick={closeFilterModal}
    ></button>

    <form
      onsubmit={handleSearchSubmit}
      class="relative w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-5 shadow-lg"
    >
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900">Search & Filters</h2>
        <button type="button" onclick={closeFilterModal} class="text-gray-500 hover:text-gray-700">
          <span class="material-symbols-rounded">close</span>
        </button>
      </div>

      <label class="mb-4 flex flex-col gap-1">
        <span class="text-xs uppercase tracking-wider text-gray-500">Name search</span>
        <input
          type="text"
          bind:value={searchQuery}
          bind:this={modalSearchInput}
          placeholder="Search by name..."
          class="rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none focus:bg-white"
        />
      </label>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label class="flex flex-col gap-1">
          <span class="text-xs uppercase tracking-wider text-gray-500">University</span>
          <select bind:value={selectedUniversity} class="rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none focus:bg-white">
            <option value="">Any</option>
            {#each universityOptions as option}
              <option value={option}>{option}</option>
            {/each}
          </select>
        </label>

        <label class="flex flex-col gap-1">
          <span class="text-xs uppercase tracking-wider text-gray-500">Degree</span>
          <select bind:value={selectedDegree} class="rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none focus:bg-white">
            <option value="">Any</option>
            {#each degreeOptions as option}
              <option value={option}>{option}</option>
            {/each}
          </select>
        </label>
      </div>

      <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label class="flex flex-col gap-1">
          <span class="text-xs uppercase tracking-wider text-gray-500">Min age</span>
          <input type="number" min="0" bind:value={minAge} class="rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none focus:bg-white" />
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-xs uppercase tracking-wider text-gray-500">Max age</span>
          <input type="number" min="0" bind:value={maxAge} class="rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none focus:bg-white" />
        </label>
      </div>

      <div class="mt-3">
        <p class="text-xs uppercase tracking-wider text-gray-500 mb-2">Interests</p>
        <div class="max-h-40 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-2">
          <div class="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {#each interestOptions as option}
              <label class="inline-flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" value={option} bind:group={selectedInterests} class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span>{option}</span>
              </label>
            {/each}
          </div>
        </div>
      </div>

      <div class="mt-3 flex flex-wrap items-center gap-2">
        <label class="flex items-center gap-2 text-sm text-gray-700">
          <span class="text-xs uppercase tracking-wider text-gray-500">Sort</span>
          <select bind:value={sortBy} class="rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none focus:bg-white min-w-45">
            <option value="none">None</option>
            <option value="account_age_desc">Account Age (Desc)</option>
            <option value="user_age_asc">User Age (Asc)</option>
          </select>
        </label>

        <button type="submit" class="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-colors">Apply</button>
        <button type="button" onclick={resetFilters} class="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors">Reset</button>
      </div>
    </form>
  </div>
{/if}

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
                  {activeGroup === 'requests' ? 'Matched with You' : activeGroup === 'search' ? 'Search Results' : 'Recommendations'}
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
            </div>
          </div>
        </article>
      {/if}
    </section>
  </div>
</main>
