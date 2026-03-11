<script>
    let { data } = $props();

    import { enhance } from '$app/forms';
    import { addDays, startOfWeek, format, isSameDay, parseISO } from 'date-fns';
    $inspect(data.user);

    let currentWeekStart = $state(startOfWeek(new Date(), { weekStartsOn: 1 }));
    let days = $derived(Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i)));
    let showAddEvent = $state(false);

    function nextWeek() {
        currentWeekStart = addDays(currentWeekStart, 7);
    }

    function previousWeek() {
        currentWeekStart = addDays(currentWeekStart, -7);
    }

    function goToToday() {
        currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1});
    }

    function getEventsAtDay(day) {
        return data.events.filter(event => isSameDay(parseISO(event.date), day));
    }

    //important: get position of event 
    //below: each hour is h-20 ==> 80pixels
    //return nb of pixels that the event should be 
    function getTimePos(timeStr){
        if (!timeStr) return 0;
        const [hours, minutes] = timeStr.split(':').map(Number);
        return (hours * 80) + (minutes * 80 / 60);
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

        {#if data.user?.isAdmin}
            <button onclick={ ()=> showAddEvent = true} class="bg-red text-black px-4 py-2 rounded-full text-sm font-bold shadow-lg hover:scale-105 transition-transform">
                + New Event
            </button>
        {/if}
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
                    <div class="relative border-r border-gray-100 last:border-0">
                        {#each getEventsAtDay(day) as event}
                                <div class="absolute left-1 right-1 p-2 rounded-lg bg-blue-100 border-l-4 border-blue-600 shadow-sm cursor-pointer hover:bg-blue-200 transition-colors z-10"
                                    style="top: {getTimePos(event.time)}px;">
                                    <p class="text-[10px] font-bold text-blue-800 leading-tight">{event.name}</p>
                                    <p class="text-[9px] text-blue-600 font-medium">{event.time.slice(0,5)}</p>
                            </div>
                        {/each}
                    </div>
                {/each}
            </div>
        </div>
    </div>
</div>

{#if showAddEvent}
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <form method="POST" action="?/addEvent" use:enhance={() => { showAddEvent = false; }} class="bg-white p-6 rounded-3xl w-full max-w-md shadow-2xl">
            <h2 class="text-xl font-bold mb-6">Create New Event</h2>
            <div class="space-y-4">
                <input type="text" name="name" placeholder="Event Name" required class="w-full p-3 border rounded-xl" />
                <div class="grid grid-cols-2 gap-4">
                    <input type="date" name="date" required class="p-3 border rounded-xl" />
                    <input type="time" name="time" required class="p-3 border rounded-xl" />
                </div>
                <textarea name="desc" placeholder="Description" class="w-full p-3 border rounded-xl h-24"></textarea>
            </div>
            <div class="flex gap-4 mt-8">
                <button type="button" onclick={() => showAddEvent = false} class="flex-1 py-3 text-gray-500 font-bold">Cancel</button>
                <button type="submit" class="flex-1 py-3 bg-[#0C00BF] text-white rounded-xl font-bold">Create</button>
            </div>
        </form>
    </div>
{/if} 
<!--I CANT SEE IT: CHECK IS ADMIN AND LOG OUT THEN TEST-->
