<script lang="ts">
    import { slide } from 'svelte/transition';
    
    let isExpanded = false;

    const campaignTypes = [
        {
            title: 'Crowdfunding',
            description: 'Raise ERG or custom tokens with customizable contribution limits',
            icon: '💰',
            color: 'blue'
        },
        {
            title: 'Token Mint + LP',
            description: 'Launch new tokens and automatically create liquidity pools',
            icon: '🪙',
            color: 'cyan'
        },
        {
            title: 'Multi-Asset LP',
            description: 'Create liquidity pools between any two tokens',
            icon: '🔄',
            color: 'yellow'
        },
        {
            title: 'ERG + Asset LP',
            description: 'Create ERG-paired liquidity pools',
            icon: '⚡',
            color: 'purple'
        }
    ];
</script>

<div class="p-4 mb-4 border rounded-lg bg-[var(--card-bg)] border-[var(--main-color)] text-[var(--text-primary)]" role="alert">
    <div 
        class="flex items-center justify-between cursor-pointer" 
        on:click={() => isExpanded = !isExpanded}
        on:keydown={(e) => e.key === 'Enter' && (isExpanded = !isExpanded)}
        role="button"
        tabindex="0"
    >
        <div class="flex items-center">
            <svg class="flex-shrink-0 w-5 h-5 me-2 text-[var(--main-color)]" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z"/>
            </svg>
            <h3 class="text-lg font-medium">Launch Your Campaign on Mew Finance</h3>
        </div>
        
        <svg 
            class="w-5 h-5 text-[var(--main-color)] transition-transform duration-200 {isExpanded ? 'rotate-180' : ''}" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
        >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
    </div>

    {#if isExpanded}
        <div transition:slide>
            <div class="mt-4 mb-6 text-sm text-[var(--text-secondary)]">
                <p class="mb-4">Choose from our flexible campaign types to achieve your project goals:</p>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {#each campaignTypes as type}
                        <div class="p-4 rounded-lg bg-[var(--forms-bg)] border border-[var(--border-color)] hover:border-[var(--main-color)] transition-colors">
                            <div class="flex items-center gap-3 mb-2">
                                <span class="text-2xl">{type.icon}</span>
                                <h4 class="font-medium text-[var(--text-primary)]">{type.title}</h4>
                            </div>
                            <p class="text-[var(--text-secondary)] text-sm">
                                {type.description}
                            </p>
                        </div>
                    {/each}
                </div>
            </div>

            <a 
                href="/new"
                class="text-[var(--background)] bg-[var(--main-color)] hover:opacity-90 focus:ring-4 focus:outline-none focus:ring-[var(--main-color)]/20 
                       font-medium rounded-lg text-sm px-4 py-2 me-2 text-center inline-flex items-center transition-all"
            >
                <svg class="me-2 h-4 w-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                Create Campaign
            </a>
        </div>
    {/if}
</div>

<style>
    /* Ensure smooth height transition for the collapsible content */
    :global(.slide-enter-active),
    :global(.slide-leave-active) {
        transition: all 0.3s ease-out;
    }

    :global(.slide-enter-from),
    :global(.slide-leave-to) {
        transform: translateY(-20px);
        opacity: 0;
    }
</style>