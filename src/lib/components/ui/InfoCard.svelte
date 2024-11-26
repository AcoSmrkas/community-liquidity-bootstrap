<script>
    export let title = '';
    export let message = '';
</script>

<div class="mt-6 bg-gray-700/50 border border-gray-600 rounded-lg p-4">
    <div class="flex items-start gap-3">
        <div class="p-2 bg-cyan-500/20 rounded-lg">
            <svg class="w-5 h-5 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        </div>
        <div>
            {#if title}
                <h3 class="text-white font-medium mb-1">{title}</h3>
            {/if}
            <p class="text-gray-400 text-sm">{message}</p>
        </div>
    </div>
</div>