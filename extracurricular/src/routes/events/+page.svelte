<script>
    let { data } = $props();

    import { addDays, startOfWeek, format, isSameDay } from 'date-fns';

    let currentWeekStart = $state(startOfWeek(new Date(), { weekStartsOn: 1 }));
    let days = $derived(Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i)));

    function nextWeek() {
        currentWeekStart = addDays(currentWeekStart, 7);
    }

    function previousWeek() {
        currentWeekStart = addDays(currentWeekStart, -7);
    }

    function goToToday() {
        currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1});
    }
</script>

<div class="flex flex-col h-screen bg-white">
    <header class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h2 class="text-lg font-semibold text-gray-900">
            {format(currentWeekStart, 'MMMM yyyy')}
        </h2>
        <h1 class="text-center mt-5 text-3xl">Events</h1>
        <div class="flex items-center space-x-4">
            <button onclick={goToToday} class="px-3 py-1 text-sm font-medium border rounded-md hover:bg-gray-50">Today</button>
            <div class="flex items-center border rounded-md">
                <button onclick={previousWeek} class="p-2 hover:bg-gray-50 border-r">
                    <span class="material-symbols-rounded">chevron_left</span>
                </button>
                <button onclick={nextWeek} class="p-2 hover:bg-gray-50">
                    <span class="material-symbols-rounded">chevron_right</span>
                </button>
            </div>
        </div>
    </header>

    <div class="flex flex-col flex-1 overflow-hidden">
        <div class="grid grid-cols-7 border-b border-gray-200 ml-16">
            {#each days as day}
                <div class="py-3 text-center">
                    <span class="text-xs font-semibold uppercase text-gray-500">{format(day, 'EEE')}</span>
                    <div class="mt-1 flex items-center justify-center">
                        <span class="h-8 w-8 flex items-center justify-center rounded-full text-sm
                            {isSameDay(day, new Date()) ? 'bg-blue-600 text-white font-bold' : 'text-gray-900'}">
                            {format(day, 'd')}
                        </span>
                    </div>
                </div>
            {/each}
        </div>

        <div class="flex-1 overflow-y-auto flex">
            <div class="w-16 flex-none border-right border-gray-100 bg-white">
                {#each Array.from({ length: 24 }) as _, h}
                    <div class="h-20 text-right pr-2 text-xs text-gray-400 -mt-2">
                        {h}:00
                    </div>
                {/each}
            </div>

            <div class="flex-1 grid grid-cols-7 relative">
                <div class="absolute inset-0 pointer-events-none">
                    {#each Array.from({ length: 24 }) as _, h}
                        <div class="h-20 border-b border-gray-100 w-full"></div>
                    {/each}
                </div>

                {#each days as day}
                    <div class="relative border-r border-gray-100 group">
                        </div>
                {/each}
            </div>
        </div>
    </div>
</div>
