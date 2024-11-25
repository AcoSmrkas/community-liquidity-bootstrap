<script>
    import { nFormatter } from '$lib/utils/utils.js';
   
    export let stats = [];
    export let columns = 3;
    export let fullWidth = false;

    // Helper function to get grid columns class
    const getGridClass = (cols) => {
        switch(cols) {
            case 2: return 'md:grid-cols-2';
            case 3: return 'md:grid-cols-3';
            case 4: return 'md:grid-cols-4';
            default: return 'md:grid-cols-3';
        }
    };
</script>

<div class="grid grid-cols-1 xs:grid-cols-2 {getGridClass(columns)} gap-4 w-full {fullWidth ? 'max-w-full' : 'max-w-6xl'} mx-auto mb-6">
    {#each stats as stat}
        <div 
            class="stat-card transition-all duration-200 {stat.fullWidth ? 'col-span-full' : ''}"
            class:full-width={stat.fullWidth}
        >
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
    /* Base styles */
    .stat-card {
        background-color: var(--footer);
        padding: 0.75rem;
        border-radius: 0.5rem;
        border: 1px solid rgba(255, 255, 255, 0.1);
        transition: all 0.2s ease;
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

    /* Responsive adjustments */
    @media (max-width: 480px) {
        .stat-card {
            padding: 0.625rem;
        }

        .stat-label {
            font-size: 0.75rem;
        }

        .stat-value {
            font-size: 0.875rem;
        }

        .stat-suffix {
            font-size: 0.75rem;
        }
    }

    /* Full width handling */
    .full-width {
        grid-column: 1 / -1;
    }
</style>