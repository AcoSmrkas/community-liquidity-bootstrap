<script>
    export let errors = [];
</script>

{#if errors.length > 0}
    <div class="mt-6 bg-red-500/10 border border-red-500 rounded-lg p-4">
        <h4 class="text-red-400 font-medium mb-2">Please check the following:</h4>
        <ul class="space-y-1 text-sm text-red-400">
            {#each errors as error}
                <li>• {error}</li>
            {/each}
        </ul>
    </div>
{/if}