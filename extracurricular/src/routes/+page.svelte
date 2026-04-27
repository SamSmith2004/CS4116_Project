<script>
	import { onMount, tick } from 'svelte';
	import { showToast } from '$lib/toast.svelte.js';

	const defaultAvatarUrl = '/images/logo.png';

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
	let isSubmittingDecision = $state(false);

	let selectedUniversity = $state('');
	let selectedDegree = $state('');
	let selectedInterests = $state([]);
	let minAge = $state('');
	let maxAge = $state('');
	let sortBy = $state('none');
	let modalSearchInput = $state();

	const hasAppliedFilters = $derived.by(() =>
		Boolean(
			selectedUniversity ||
			selectedDegree ||
			minAge ||
			maxAge ||
			(selectedInterests?.length ?? 0) > 0 ||
			sortBy !== 'none'
		)
	);

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

	const hasAnySearchCriteria = $derived.by(() =>
		Boolean(
			searchQuery ||
			selectedUniversity ||
			selectedDegree ||
			minAge ||
			maxAge ||
			(selectedInterests?.length ?? 0) > 0 ||
			sortBy !== 'none'
		)
	);

	const activePosition = $derived.by(() => {
		if (!currentMatch) return 0;
		if (hasSearchActive) return searchIndex + 1;
		if (activeGroup === 'requests') return requestIndex + 1;
		if (activeGroup === 'recommendations') return recommendationIndex + 1;
		return 0;
	});

	const activeTotal = $derived.by(() => {
		if (hasSearchActive) return searchResults.length;
		return requests.length + recommendations.length;
	});

	const shouldShowRelationshipNotice = $derived.by(() =>
		Boolean(hasSearchActive && currentMatch?.relationshipStatus)
	);

	function clearSearchState() {
		hasSearchActive = false;
		searchResults = [];
		searchIndex = 0;
	}

	function makeUrlParamsFromFilters() {
		const params = new URLSearchParams();
		if (searchQuery) params.set('q', searchQuery);
		if (selectedUniversity) params.set('university', selectedUniversity);
		if (selectedDegree) params.set('degree', selectedDegree);
		if (minAge) params.set('minAge', minAge);
		if (maxAge) params.set('maxAge', maxAge);
		if ((selectedInterests?.length ?? 0) > 0) params.set('interests', selectedInterests.join(','));
		if (sortBy !== 'none') params.set('sort', sortBy);
		return params;
	}

	function updateBrowserUrlWithFilters() {
		if (!window) return;

		const params = makeUrlParamsFromFilters();
		const query = params.toString();
		const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
		window.history.replaceState(window.history.state, '', nextUrl);
	}

	function loadFiltersFromUrl() {
		if (!window) return false;
		
		const params = new URLSearchParams(window.location.search);
		searchQuery = (params.get('q') ?? '').trim();
		selectedUniversity = (params.get('university') ?? '').trim();
		selectedDegree = (params.get('degree') ?? '').trim();
		minAge = (params.get('minAge') ?? '').trim();
		maxAge = (params.get('maxAge') ?? '').trim();
		sortBy = (params.get('sort') ?? 'none').trim() || 'none';
		selectedInterests = (params.get('interests') ?? '')
			.split(',')
			.map((value) => value.trim())
			.filter(Boolean);

		return hasAnySearchCriteria;
	}

	onMount(async () => {
		const hasFiltersInUrl = loadFiltersFromUrl();
		if (hasFiltersInUrl) {
			await executeSearch();
		}
	});

	async function executeSearch() {
		updateBrowserUrlWithFilters();

		if (!hasAnySearchCriteria) {
			clearSearchState();
			return;
		}

		const params = makeUrlParamsFromFilters();
		if (!params.has('sort')) {
			params.set('sort', 'none');
		}

		const response = await fetch(`/api/users/search?${params.toString()}`);
		const result = await response.json();

		if (!response.ok) {
			if (response.status === 400) {
				minAge = '';
				maxAge = '';
				updateBrowserUrlWithFilters();
				clearSearchState();
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

	function resetFilters() {
		searchQuery = '';
		selectedUniversity = '';
		selectedDegree = '';
		selectedInterests = [];
		minAge = '';
		maxAge = '';
		sortBy = 'none';
		clearSearchState();
		showFilterModal = false;
		updateBrowserUrlWithFilters();
	}

	function skipCurrentSearchResult() {
		if (!hasSearchActive || !currentMatch) return;
		searchResults = searchResults.filter((profile) => profile.id !== currentMatch.id);
	}

	async function handleChoice(decision) {
		if (!currentMatch || isSubmittingDecision) return;

		isSubmittingDecision = true;

		const formData = new FormData();
		formData.set('requestId', currentMatch.id);
		formData.set('decision', decision);

		try {
			const response = await fetch('?/decide', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				showToast('Could not save your decision. Please try again.', 'error');
				return;
			}

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
		} catch {
			showToast('Could not save your decision. Please try again.', 'error');
		} finally {
			isSubmittingDecision = false;
		}
	}

</script>

<header class="sticky top-0 z-40 w-full border-b border-gray-200 bg-white shadow-sm">
	<div class="flex min-h-14 items-center justify-center px-6 py-2">
		<div class="w-full max-w-lg">
			<div class="relative flex items-center">
				<span
					class="material-symbols-rounded pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[20px] text-gray-400"
				>
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
					class="w-full cursor-pointer rounded-xl border border-gray-300 bg-gray-50 py-2 pr-18 pl-10 text-sm text-gray-900 placeholder-gray-400 transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
				/>

				{#if hasAppliedFilters}
					<span
						class="material-symbols-rounded absolute top-1/2 right-10 -translate-y-1/2 text-[18px] text-blue-600"
						title="Filters active"
					>
						filter_alt
					</span>
				{/if}

				{#if searchQuery || hasAppliedFilters || hasSearchActive}
					<button
						type="button"
						onclick={resetFilters}
						class="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
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
				<span class="text-xs tracking-wider text-gray-500 uppercase">Name search</span>
				<input
					type="text"
					bind:value={searchQuery}
					bind:this={modalSearchInput}
					placeholder="Search by name..."
					class="rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
				/>
			</label>

			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<label class="flex flex-col gap-1">
					<span class="text-xs tracking-wider text-gray-500 uppercase">University</span>
					<select
						bind:value={selectedUniversity}
						class="rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
					>
						<option value="">Any</option>
						{#each universityOptions as option}
							<option value={option}>{option}</option>
						{/each}
					</select>
				</label>

				<label class="flex flex-col gap-1">
					<span class="text-xs tracking-wider text-gray-500 uppercase">Degree</span>
					<select
						bind:value={selectedDegree}
						class="rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
					>
						<option value="">Any</option>
						{#each degreeOptions as option}
							<option value={option}>{option}</option>
						{/each}
					</select>
				</label>
			</div>

			<div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
				<label class="flex flex-col gap-1">
					<span class="text-xs tracking-wider text-gray-500 uppercase">Min age</span>
					<input
						type="number"
						min="0"
						bind:value={minAge}
						class="rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
					/>
				</label>
				<label class="flex flex-col gap-1">
					<span class="text-xs tracking-wider text-gray-500 uppercase">Max age</span>
					<input
						type="number"
						min="0"
						bind:value={maxAge}
						class="rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
					/>
				</label>
			</div>

			<div class="mt-3">
				<p class="mb-2 text-xs tracking-wider text-gray-500 uppercase">Interests</p>
				<div class="max-h-40 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-2">
					<div class="grid grid-cols-1 gap-1 sm:grid-cols-2">
						{#each interestOptions as option}
							<label class="inline-flex items-center gap-2 text-sm text-gray-700">
								<input
									type="checkbox"
									value={option}
									bind:group={selectedInterests}
									class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
								/>
								<span>{option}</span>
							</label>
						{/each}
					</div>
				</div>
			</div>

			<div class="mt-3 flex flex-wrap items-center gap-2">
				<label class="flex items-center gap-2 text-sm text-gray-700">
					<span class="text-xs tracking-wider text-gray-500 uppercase">Sort</span>
					<select
						bind:value={sortBy}
						class="min-w-45 rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
					>
						<option value="none">None</option>
						<option value="account_age_desc">Account Age (Desc)</option>
						<option value="user_age_asc">User Age (Asc)</option>
					</select>
				</label>

				<button
					type="submit"
					class="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100"
					>Apply</button
				>
				<button
					type="button"
					onclick={resetFilters}
					class="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100"
					>Reset</button
				>
			</div>
		</form>
	</div>
{/if}

<main class="min-h-[calc(100vh-3.5rem)] bg-transparent px-4 py-6 md:px-6 md:py-8">
	<div class="mx-auto max-w-5xl">
		<section>
			<div class="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-gray-200/80 bg-white/75 px-5 py-4 shadow-lg backdrop-blur-md">
				<div>
					<h1 class="text-3xl font-bold text-gray-900">Matching Process</h1>
					<p class="mt-1 text-sm text-gray-700">
						Review profiles and pick who you want to connect with.
					</p>
				</div>
				<span
					class="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold tracking-wide text-gray-600 uppercase"
				>
					{activePosition} / {activeTotal || 0}
				</span>
			</div>

			{#if !currentMatch}
				<div class="rounded-3xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
					<h2 class="text-2xl font-bold text-gray-800">No profiles available</h2>
					<p class="mt-2 text-gray-500">
						Try clearing search or check back later for new recommendations.
					</p>
				</div>
			{:else}
				<article
					class="overflow-hidden rounded-3xl border border-gray-200 shadow-md transition-colors"
					style={`background-color: ${currentUniversityTint};`}
				>
					<div class="flex flex-col md:flex-row">
						<div class="shrink-0 md:w-2/5">
							<img
								src={currentMatch.imageUrl || defaultAvatarUrl}
								alt={`Profile picture of ${currentMatch.name}`}
								class="h-72 w-full object-cover md:h-full"
							/>
						</div>

						<div class="flex flex-1 flex-col justify-between p-6 sm:p-8">
							<div>
								<p
									class="mb-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase {activeGroup ===
									'requests'
										? 'bg-amber-100 text-amber-700'
										: 'bg-sky-100 text-sky-700'}"
								>
									{activeGroup === 'requests'
										? 'Matched with You'
										: activeGroup === 'search'
											? 'Search Results'
											: 'Recommendations'}
								</p>

								<div class="flex items-baseline gap-3">
									<h2 class="text-left text-3xl leading-tight font-bold text-gray-900">
										{currentMatch.name}
									</h2>
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
											{#each currentMatch.interests.slice(0, 3) as interest}
                        <span class="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-sm font-medium">{interest}</span>
                      {/each}

											{#if currentMatch.interests.length > 3}
                        <span class="px-3 py-1 rounded-full bg-slate-200 text-slate-700 text-sm font-semibold">
													+{currentMatch.interests.length - 3} more
                        </span>
                      {/if}
                    </dd>
                  </div>
                </dl>
              </div>

							<div class="mt-8 grid grid-cols-2 gap-4">
								<a
									href={`/profile/view/${currentMatch.id}`}
									class="col-span-2 inline-flex w-full items-center justify-center rounded-2xl border-2 border-blue-200 bg-blue-50 px-5 py-4 text-lg font-semibold text-blue-700 transition-colors hover:bg-blue-100"
								>
									View Profile
								</a>

								{#if shouldShowRelationshipNotice}
									<p class="col-span-2 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-center text-sm font-medium text-amber-800">
										You have an existing relationship with this user. Please visit the
										<a href="/matches" class="underline underline-offset-2">Matches page</a>
										for details.
									</p>
									<button
										type="button"
										onclick={skipCurrentSearchResult}
										class="col-span-2 inline-flex w-full items-center justify-center rounded-2xl border-2 border-gray-200 bg-gray-50 px-5 py-4 text-lg font-semibold text-gray-700 transition-colors hover:bg-gray-100"
									>
										Next
									</button>
								{:else}
									<button
										type="button"
						onclick={() => handleChoice('fail')}
						disabled={!currentMatch || isSubmittingDecision}
										class="w-full rounded-2xl px-5 py-4 text-lg font-semibold bg-red-50 text-red-700 border-2 border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
									>
										Fail
									</button>

									<button
										type="button"
						onclick={() => handleChoice('pass')}
						disabled={!currentMatch || isSubmittingDecision}
										class="w-full rounded-2xl px-5 py-4 text-lg font-semibold bg-emerald-50 text-emerald-700 border-2 border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
									>
										Pass
									</button>
								{/if}
							</div>
            </div>
          </div>
        </article>
      {/if}
    </section>
  </div>
</main>
