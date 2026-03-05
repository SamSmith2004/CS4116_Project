<script>
    import { page } from '$app/stores';
    import { tick } from 'svelte';

    const mockNames = {
        '1': 'Alice Murphy',
        '2': 'Brian Kelly',
        '3': 'Ciara Smith',
        '4': 'Dylan Reeves',
        '5': 'Emma Walsh',
        '6': 'Fionn Gallagher',
        '7': 'Grace Nolan',
        '8': 'Hugo Brennan',
        '9': 'Saoirse Flynn',
        '10': 'Liam Doyle',
        '11': 'Aoife Byrne',
        '12': 'Oisín McCarthy',
        '13': 'Niamh Kavanagh',
        '14': 'Conor Duffy',
        '15': 'Róisín Healy',
        '16': 'Cian Moran',
        '17': 'Éabha Daly',
        '18': 'Seán Fitzgerald',
        '19': 'Méabh Connolly',
        '20': 'Darragh Quinn'
    };

    let convoId = '';
    let partnerName = 'Unknown';
    let messages = [];
    let newMessage = '';

    function generateMessages() {
        return [
            { id: 0, text: 'Hello! How are you?', sender: 'sender', time: '1m ago' },
            { id: 1, text: "I\'m good, thanks!", sender: 'receiver', time: 'now' }
        ];
    }

    $: {
        const params = $page.params;
        convoId = params.id;
        if (convoId) {
            partnerName = mockNames[convoId] || 'Unknown';
            messages = generateMessages();
        }
    }
    
    function handleKeydown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }

    async function sendMessage() {
        if (newMessage.trim()) {
            messages = [
                ...messages,
                { id: messages.length, text: newMessage, sender: 'sender', time: 'now' }
            ];
            newMessage = '';

            // scroll to latest, 'tick' gives moment for DOM to get new element before selecting 'messageContainer'
            await tick();
            const container = document.getElementById('messageContainer');
            container?.scrollTo(0, container.scrollHeight);
        }
    }
</script>

<div class="flex flex-col h-screen">
    <header class="flex items-center px-4 py-2 bg-white border-b border-gray-200">
        <a href="/messaging" class="text-gray-500 hover:text-gray-700 mr-3">
            <span class="material-symbols-rounded">arrow_back</span>
        </a>
        <h2 class="text-lg font-semibold text-gray-900 truncate">{partnerName}</h2>
    </header>

    <div id="messageContainer" class="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {#each messages as msg (msg.id)}
            <div class="flex {msg.sender === 'sender' ? 'justify-end' : 'justify-start'}">
                <div class="max-w-[70%] min-w-0 px-4 py-2 rounded-xl wrap-break-words overflow-hidden
                    {msg.sender === 'sender' ? 'bg-blue-500 text-white' : 'bg-white text-gray-900'}
                    shadow">
                    <p class="text-sm whitespace-pre-wrap">{msg.text}</p>
                    <span class="text-xs text-gray-400 block text-right mt-1">{msg.time}</span>
                </div>
            </div>
        {/each}
    </div>

    <div class="border-t border-gray-200 p-4 bg-white">
        <div class="flex gap-2">
            <textarea
                bind:value={newMessage}
                placeholder="Type a message..."
                rows="1"
                class="flex-1 px-4 py-2 border rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                on:keydown={handleKeydown}
            ></textarea>
            <button
                class="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50"
                on:click={sendMessage}
                disabled={!newMessage.trim()}
            >
                Send
            </button>
        </div>
    </div>
</div>

<style>
    :global(html, body) {
        height: 100%;
    }
</style>
