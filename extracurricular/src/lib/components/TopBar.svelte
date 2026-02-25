<script>
	let { placeholder = 'Search...', onSearch } = $props();

	let query = $state('');

	function handleSubmit(e) {
		e.preventDefault();
		onSearch?.(query);
	}

	function clearSearch() {
		query = '';
		onSearch?.('');
	}
</script>

<header class="sticky top-0 z-40 w-full bg-white border-b border-gray-200 shadow-sm">
	<div class="flex items-center justify-center px-6 h-14">
		<form onsubmit={handleSubmit} class="w-full max-w-lg">
			<div class="relative flex items-center">
				<span class="material-symbols-rounded absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px] pointer-events-none">
					search
				</span>
				<input
					type="text"
					bind:value={query}
					{placeholder}
					class="w-full pl-10 pr-10 py-2 rounded-xl border border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-400 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none focus:bg-white transition"
				/>
				{#if query}
					<button
						type="button"
						onclick={clearSearch}
						class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
					>
						<span class="material-symbols-rounded text-[18px]">close</span>
					</button>
				{/if}
			</div>
		</form>
	</div>
</header>
