<script>
    import TopBar from '$lib/components/TopBar.svelte';
    let { data } = $props();

    function handleSearch(query) {
        console.log('searching:', query);
    }
</script>

<TopBar placeholder="Filter conversations" onSearch={handleSearch} />
<h1 class="text-center mt-5 text-3xl">Messaging</h1>