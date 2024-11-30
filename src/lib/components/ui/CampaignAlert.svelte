<script lang="ts">
    import { slide } from 'svelte/transition';
    
    let isExpanded = false;
    let hoveredCard = null;

    const campaignTypes = [
        {
            title: 'Crowdfunding',
            description: 'Raise ERG or custom tokens with customizable contribution limits',
            icon: '💰',
            color: 'blue',
            features: ['Customizable contribution limits', 'Multiple token support', 'Real-time tracking']
        },
        {
            title: 'Token Mint + LP',
            description: 'Launch new tokens and automatically create liquidity pools',
            icon: '🪙',
            color: 'cyan',
            features: ['Automatic pool creation', 'Initial token distribution', 'Instant liquidity']
        },
        {
            title: 'Multi-Asset LP',
            description: 'Create liquidity pools between any two tokens',
            icon: '🔄',
            color: 'yellow',
            features: ['Any token pair support', 'Flexible pool ratios', 'Advanced swap features']
        },
        {
            title: 'ERG + Asset LP',
            description: 'Create ERG-paired liquidity pools',
            icon: '⚡',
            color: 'purple',
            features: ['ERG base pairs', 'Optimized pricing', 'Enhanced liquidity']
        }
    ];
</script>

<div class="p-6 mb-6 border-2 rounded-xl bg-[var(--card-bg)] border-[var(--main-color)] text-[var(--text-primary)] shadow-lg" role="alert">
    <div 
        class="flex items-center justify-between cursor-pointer group" 
        on:click={() => isExpanded = !isExpanded}
        on:keydown={(e) => e.key === 'Enter' && (isExpanded = !isExpanded)}
        role="button"
        tabindex="0"
    >
        <div class="flex items-center gap-4">
            <div class="p-2 rounded-lg bg-[var(--main-color)] text-white">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                </svg>
            </div>
            <div>
                <h3 class="text-xl font-bold group-hover:text-[var(--main-color)] transition-colors">Launch Your Campaign</h3>
                <p class="text-sm text-[var(--text-secondary)]">Explore different campaign types and start raising funds</p>
            </div>
        </div>
        
        <div class="relative">
            <div class="absolute -inset-2 rounded-lg bg-[var(--main-color)] opacity-0 group-hover:opacity-10 transition-opacity"></div>
            <svg 
                class="w-6 h-6 text-[var(--main-color)] transition-transform duration-300 {isExpanded ? 'rotate-180' : ''}" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
            >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
        </div>
    </div>

    {#if isExpanded}
        <div transition:slide={{ duration: 300 }} class="mt-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {#each campaignTypes as type, i}
                    <div 
                        class="relative p-6 rounded-xl bg-[var(--forms-bg)] border-2 border-transparent hover:border-[var(--main-color)] transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group"
                        on:mouseenter={() => hoveredCard = i}
                        on:mouseleave={() => hoveredCard = null}
                    >
                        <div class="flex items-center gap-4 mb-4">
                            <div class="p-2 rounded-lg bg-[var(--main-color)]/10">
                                <span class="text-3xl">{type.icon}</span>
                            </div>
                            <h4 class="text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--main-color)] transition-colors">{type.title}</h4>
                        </div>
                        <p class="text-[var(--text-secondary)] mb-4">
                            {type.description}
                        </p>
                        <ul class="space-y-2">
                            {#each type.features as feature}
                                <li class="flex items-center text-sm text-[var(--text-secondary)]">
                                    <svg class="w-4 h-4 mr-2 text-[var(--main-color)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                                    </svg>
                                    {feature}
                                </li>
                            {/each}
                        </ul>
                        <div class="absolute bottom-4 right-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                            <svg class="w-6 h-6 text-[var(--main-color)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                            </svg>
                        </div>
                    </div>
                {/each}
            </div>

            <div class="flex justify-center">
                <a 
                    href="/new"
                    class="inline-flex items-center px-8 py-4 text-lg font-bold text-[var(--background)] bg-[var(--main-color)] 
                           rounded-xl hover:opacity-90 focus:ring-4 focus:outline-none focus:ring-[var(--main-color)]/20 
                           transition-all transform hover:-translate-y-0.5 shadow-lg"
                >
                    <svg class="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                    </svg>
                    Start Your Campaign
                    <span class="relative">
                        <span class="absolute -top-1 -right-6 flex h-3 w-3">
                            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--background)] opacity-75"></span>
                            <span class="relative inline-flex rounded-full h-3 w-3 bg-[var(--background)]"></span>
                        </span>
                    </span>
                    <svg class="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                    </svg>
                </a>
            </div>
        </div>
    {/if}
</div>

<style>
    /* Add a subtle gradient border animation on hover for the campaign type cards */
    @keyframes borderGlow {
        0%, 100% { border-color: var(--main-color); }
        50% { border-color: transparent; }
    }

    /* Enhance the shadow effect */
    .shadow-lg {
        box-shadow: 0 10px 30px -15px rgba(0, 0, 0, 0.3);
    }

    /* Add a pulse animation for the button dot */
    @keyframes ping {
        75%, 100% {
            transform: scale(2);
            opacity: 0;
        }
    }

    :global(.animate-ping) {
        animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
    }
</style>