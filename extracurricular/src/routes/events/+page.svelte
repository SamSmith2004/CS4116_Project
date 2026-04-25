<script>
    let { data } = $props();

    import { enhance } from '$app/forms';
    import { addDays, startOfWeek, format, isSameDay, parseISO } from 'date-fns';
    $inspect(data.user);

    let currentWeekStart = $state(startOfWeek(new Date(), { weekStartsOn: 1 }));
    let days = $derived(Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i)));
    let showAddEvent = $state(false);
    let showViewEvent = $state(false);
    let selectedEvent = $state(null);
    let eventsList = $state([]);

    const HOUR_HEIGHT = 80; // each hour is h-20 ==> 80pixels

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
        return eventsList.filter(event => isSameDay(parseISO(event.date), day));
    }

    function parseTimeParts(timeStr) {
        if (!timeStr) return [0, 0];
    
        const match = String(timeStr).match(/(\d{2}):(\d{2})/);
        if (!match) return [0, 0];

        const hours = Number(match[1]);
        const minutes = Number(match[2]);
        return [hours, minutes];
    }

    function getTimePos(timeStr){
        const [hours, minutes] = parseTimeParts(timeStr);
        return (hours * HOUR_HEIGHT) + (minutes * HOUR_HEIGHT / 60);
    }

    function getEventHeight(startTime, endTime){
        if(!startTime || !endTime){
            return HOUR_HEIGHT;
        }

        const [hStart, mStart] = parseTimeParts(startTime);
        const [hEnd, mEnd] = parseTimeParts(endTime);

        const startMinutes = (hStart * 60) + mStart;
        const endMinutes = (hEnd * 60) + mEnd;
        const timeLength = endMinutes - startMinutes;
        return Math.max(20, (timeLength * HOUR_HEIGHT / 60));
    }

    function openEventDetails(event){
        selectedEvent = event;
        showViewEvent = true;
    }

    function attendeeCount(event) {
        return Number(event?.attendeesCount) || 0;
    }

    function eventStartDate(event) {
        if (!event?.date || !event?.time) return null;

        const eventTime = String(event.time).slice(0, 8);
        const startedAt = new Date(`${event.date}T${eventTime}`);
        return Number.isNaN(startedAt.getTime()) ? null : startedAt;
    }

    function hasEventStarted(event) {
        const startedAt = eventStartDate(event);
        if (!startedAt) return false;
        return startedAt <= new Date();
    }

    function patchEventRegistration(eventId, isRegistered, attendeesCount) {
        eventsList = eventsList.map((event) => {
            if (event.id !== eventId) return event;

            return {
                ...event,
                isRegistered,
                attendeesCount
            };
        });
    }

    function registrationEnhance() {
        return async ({ result, update }) => {
            if (result.type === 'success' && result.data?.eventId) {
                patchEventRegistration(
                    result.data.eventId,
                    Boolean(result.data.isRegistered),
                    Number(result.data.attendeesCount) || 0
                );
            }

            await update({ invalidateAll: false, reset: false });
        };
    }

    $effect(() => {
        eventsList = data.events ?? [];
    });

    $effect(() => {
        if (!showViewEvent || !selectedEvent) return;

        const refreshedEvent = eventsList.find((event) => event.id === selectedEvent.id);
        if (!refreshedEvent) {
            showViewEvent = false;
            selectedEvent = null;
            return;
        }

        selectedEvent = refreshedEvent;
    });
</script>

<div class="flex flex-col h-screen bg-transparent">
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
            <button onclick={ ()=> showAddEvent = true} class="bg-red text-red px-4 py-2 rounded-full text-sm font-bold shadow-lg hover:scale-105 transition-transform">
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
                    <div class="text-right pr-2 text-xs text-gray-400" style="height: {HOUR_HEIGHT}px;">
                        {h}:00
                    </div>
                {/each}
            </div>

            <div class="flex-1 grid grid-cols-7 relative">
                <div class="absolute inset-0 pointer-events-none">
                    {#each Array.from({ length: 24 }) as _, h}
                        <div class="border-b border-gray-100 w-full" style="height: {HOUR_HEIGHT}px;"></div>
                    {/each}
                </div>

                {#each days as day}
                    <div class="relative border-r border-gray-100 last:border-0">
                        {#each getEventsAtDay(day) as event} 
                            <button 
                                type="button"
                                onclick={() => openEventDetails(event)} 
                                class="absolute left-1 right-1 p-2 rounded-lg bg-blue-100 border-l-4 border-blue-600 shadow-sm z-10 overflow-hidden text-left hover:bg-blue-200 transition-colors" 
                                style="top: {getTimePos(event.time)}px; height: {getEventHeight(event.time, event.endTime)}px;"
                            >
                                <p class="text-[10px] font-bold text-blue-800 leading-tight truncate">{event.name}</p>
                                <p class="text-[9px] text-blue-600 font-medium">
                                    {event.time.slice(0,5)} - {event.endTime?.slice(0,5) || '?'}
                                </p>
                                <p class="text-[9px] text-blue-700 font-semibold">
                                    {attendeeCount(event)} attendee{attendeeCount(event) === 1 ? '' : 's'}
                                </p>
                            </button>
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
                <div class="grid grid-cols-3 gap-4">
                    <input type="date" name="date" required class="p-3 border rounded-xl" />
                    <input type="time" name="time" required class="p-3 border rounded-xl" />
                    <input type="time" name="endTime" required class="p-3 border rounded-xl" />
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

{#if showViewEvent && selectedEvent}
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div class="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden relative">
            <button onclick={() => showViewEvent = false} class="absolute top-4 right-4 p-2 bg-white/80 hover:bg-white rounded-full shadow-md z-10">
                <span class="material-symbols-rounded">close</span>
            </button>

            {#if selectedEvent.imgUrl}
                <div class="w-full h-48 bg-gray-200">
                    <img src={selectedEvent.imgUrl} alt={selectedEvent.name} class="w-full h-full object-cover" />
                </div>
            {/if}

            <div class="p-8">
                <div class="mb-6">
                    <p class="text-blue-600 text-xs font-bold uppercase tracking-widest mb-1">Event Details</p>
                    <h2 class="text-3xl font-black text-gray-900 leading-tight">{selectedEvent.name}</h2>
                </div>

                <div class="grid grid-cols-2 gap-4 mb-6 text-sm">
                    <div class="flex items-center gap-2 text-gray-600">
                        <span class="material-symbols-rounded text-blue-600">calendar_today</span>
                        <span class="font-bold">{format(parseISO(selectedEvent.date), 'EEEE dd MMMM')}</span>
                    </div>
                    <div class="flex items-center gap-2 text-gray-600">
                        <span class="material-symbols-rounded text-blue-600">schedule</span>
                        <span class="font-bold">{selectedEvent.time.slice(0,5)} - {selectedEvent.endTime?.slice(0,5)}</span>
                    </div>
                </div>

                <div class="mb-6 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 flex items-center gap-3">
                    <span class="material-symbols-rounded text-blue-700">groups</span>
                    <p class="text-sm font-semibold text-blue-800">
                        {attendeeCount(selectedEvent)} attendee{attendeeCount(selectedEvent) === 1 ? '' : 's'} registered
                    </p>
                </div>

                <div class="mb-8">
                    <p class="text-xs font-bold text-gray-400 uppercase mb-2">Description</p>
                    <p class="text-gray-600 leading-relaxed whitespace-pre-wrap">
                        {selectedEvent.desc || "No description provided for this event."}
                    </p>
                </div>

                <div class="mb-8">
                    {#if hasEventStarted(selectedEvent)}
                        <p class="w-full py-3 text-center rounded-xl font-bold bg-gray-100 text-gray-500">
                            Registration closed (event already started)
                        </p>
                    {:else if selectedEvent.isRegistered}
                        <form method="POST" action="?/unregisterEvent" use:enhance={registrationEnhance}>
                            <input type="hidden" name="eventId" value={selectedEvent.id} />
                            <button
                                type="submit"
                                class="w-full py-3 bg-red-50 text-red-700 rounded-xl font-bold hover:bg-red-100 transition-colors"
                            >
                                Unregister
                            </button>
                        </form>
                    {:else}
                        <form method="POST" action="?/registerEvent" use:enhance={registrationEnhance}>
                            <input type="hidden" name="eventId" value={selectedEvent.id} />
                            <button
                                type="submit"
                                class="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
                            >
                                Register
                            </button>
                        </form>
                    {/if}
                </div>

                {#if data.user?.isAdmin}
                    <div class="mt-8 pt-6 border-t border-gray-100">
                        <form method="POST" action="?/deleteEvent" use:enhance={() => {
                            return async ({ result }) => {
                                if (result.type === 'success') {
                                    showViewEvent = false; // On ferme le pop-up après suppression
                                    selectedEvent = null;
                                }
                            };
                        }}>
                            <input type="hidden" name="id" value={selectedEvent.id} />
                            <button 
                                type="submit" 
                                class="w-full py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                            >
                                <span class="material-symbols-rounded text-lg">delete</span>
                                Delete Event
                            </button>
                        </form>
                    </div>
                {/if}

                <div class="flex items-center gap-4">
                    {#if selectedEvent.url}
                        <a href={selectedEvent.url} target="_blank" class="flex-1 text-center py-3 bg-gray-100 text-gray-900 rounded-xl font-bold hover:bg-gray-200 transition-colors">
                            Visit Website
                        </a>
                    {/if}
                </div>
            </div>
        </div>
    </div>
{/if} 


