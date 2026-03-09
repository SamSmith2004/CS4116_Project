<script>
	let { name, lastMessage, time, avatarColor = 'bg-blue-500' } = $props();
</script>

<button
	class="w-full flex items-center gap-4 px-5 py-4 rounded-xl hover:bg-gray-50 transition-colors text-left cursor-pointer"
>
	<div class="shrink-0">
		<!-- TODO: Replace with real avatar -->
		<div class="w-12 h-12 rounded-full {avatarColor}"></div>
	</div>

	<div class="flex-1 min-w-0">
		<div class="flex items-center justify-between gap-2">
			<span class="text-base font-semibold text-gray-900 truncate">{name}</span>
			<span class="text-xs text-gray-400 shrink-0">{time}</span>
		</div>
		<p class="text-sm text-gray-500 truncate mt-1">
			{lastMessage}
		</p>
	</div>
</button>
