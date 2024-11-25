<script>
    import { nFormatter } from '$lib/utils/utils.js';
   
    export let stats = [];
    export let columns = 3;
    export let fullWidth = false;
</script>

<div class="grid grid-cols-2 md:grid-cols-{columns} gap-4 mb-6">
    {#each stats as stat}
        <div class="stat-card {stat.fullWidth ? 'col-span-full' : ''}">
            <div class="stat-label">{stat.label}</div>
            <div class="stat-value">
                {#if stat.format === 'number'}
                    {nFormatter(stat.value)}
                {:else if stat.format === 'percentage'}
                    {stat.value}%
                {:else}
                    {stat.value}
                {/if}
                {#if stat.suffix}
                    <span class="stat-suffix">{stat.suffix}</span>
                {/if}
            </div>
        </div>
    {/each}
</div>

<style>
    .stat-card {
        background-color: var(--footer);
        padding: 0.75rem;
        border-radius: 0.5rem;
        border: 1px solid rgba(255, 255, 255, 0.1);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .stat-card:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .stat-label {
        color: var(--main-color);
        font-size: 0.875rem;
        margin-bottom: 0.25rem;
        font-weight: 500;
        opacity: 0.9;
    }

    .stat-value {
        color: white;
        font-weight: 600;
        font-size: 1rem;
        display: flex;
        align-items: baseline;
        gap: 0.25rem;
    }

    .stat-suffix {
        color: rgba(255, 255, 255, 0.8);
        font-size: 0.875rem;
        font-weight: 500;
    }
</style>