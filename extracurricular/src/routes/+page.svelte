<script>
  import TopBar from '$lib/components/TopBar.svelte';

  function handleSearch(query) {
    console.log('searching:', query);
  }
</script>

<TopBar placeholder="Search for people..." onSearch={handleSearch} />

<h1 class="text-center mt-5 text-3xl">Home</h1>
