<script>
    import { formatAddress, nFormatter } from '$lib/utils/utils.js';
    import { onMount, onDestroy } from 'svelte';
    import { fade, slide } from 'svelte/transition';
    
    export let asset = {
        name: '',
        iconUrl: '',
        tokenId: '',
        currentAmount: 0,
        targetAmount: 0,
        progress: 0
    };
    export let secondaryAsset = null;
    export let showTokenId = false;
    export let stats = [];
    export let startDate = '';
    export let poolId = '';
    export let endDate = '';
    export let campaignType = '';
    export let totalSupply = 0;
    export let initialPrice = 0;
    export let onRefresh = () => {};

    let refreshInterval;
    let isUpdating = false;
    let copiedText = '';
    let showCopiedTooltip = false;

    // Track previous values for animations
    let previousValues = {
        primaryAmount: 0,
        secondaryAmount: 0
    };

    onMount(() => {
        refreshInterval = setInterval(() => {
            onRefresh();
        }, 10000);
        previousValues.primaryAmount = asset.currentAmount;
        previousValues.secondaryAmount = secondaryAsset?.currentAmount || 0;
    });

    onDestroy(() => {
        if (refreshInterval) clearInterval(refreshInterval);
    });

    // Reactive declarations
    $: progressPercentage = (asset.currentAmount / asset.targetAmount) * 100;
    $: secondaryProgressPercentage = secondaryAsset ? 
        (secondaryAsset.currentAmount / secondaryAsset.targetAmount) * 100 : 0;
    $: estimatedPrice = (campaignType === 'multiassetlp' || campaignType === 'ergassetlp') && 
        secondaryAsset && secondaryAsset.targetAmount && asset.targetAmount ? 
        (secondaryAsset.targetAmount / asset.targetAmount).toFixed(3) : null;
    
    // Track value changes for animation
    $: {
        if (asset.currentAmount !== previousValues.primaryAmount ||
            (secondaryAsset && secondaryAsset.currentAmount !== previousValues.secondaryAmount)) {
            isUpdating = true;
            setTimeout(() => isUpdating = false, 600);
            previousValues.primaryAmount = asset.currentAmount;
            previousValues.secondaryAmount = secondaryAsset?.currentAmount || 0;
        }
    }

    // Helper functions
    function formatDateTime(dateTimeString) {
        if (!dateTimeString) return '';
        const date = new Date(dateTimeString);
        return date.toLocaleDateString() + ' ' + 
               date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function formatCompactNumber(num) {
        return new Intl.NumberFormat('en-US', {
            notation: 'compact',
            maximumFractionDigits: 1
        }).format(num);
    }

    async function copyToClipboard(text, label) {
        try {
            await navigator.clipboard.writeText(text);
            copiedText = label;
            showCopiedTooltip = true;
            setTimeout(() => {
                showCopiedTooltip = false;
                copiedText = '';
            }, 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    }

    function calculateProgressGradient(percentage) {
        if (percentage > 90) return 'linear-gradient(90deg, var(--main-color) 0%, #ffd700 100%)';
        return 'var(--main-color)';
    }
</script>

<div class="asset-container" class:updating={isUpdating}>
    <!-- Copied Tooltip -->
    {#if showCopiedTooltip}
        <div class="copied-tooltip" transition:fade={{ duration: 200 }}>
            {copiedText} copied to clipboard!
        </div>
    {/if}

    <!-- Primary Asset -->
    <div class="token-section">
        <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
                <div class="token-icon main-color" 
                     class:pulse={progressPercentage > 90}>
                    {#if asset.iconUrl}
                        <img
                            src={asset.iconUrl}
                            alt={asset.name}
                            class="w-6 h-6 rounded-full"
                            on:error={() => (event.target.src = '/api/placeholder/24/24')}
                        />
                    {:else}
                        <span>{asset.name[0]}</span>
                    {/if}
                </div>
                <span class="text-white font-medium">{asset.name}</span>
                {#if showTokenId && asset.tokenId}
                    <button 
                        class="asset-id hover:opacity-80"
                        on:click={() => copyToClipboard(asset.tokenId, 'Token ID')}
                    >
                        ({formatAddress(asset.tokenId, 6)})
                    </button>
                {/if}
            </div>
            <div class="flex items-center gap-3 text-xs">
                <span class="stat-mini">
                    <span class="text-yellow-400">Min:</span>
                    <span class="text-white">{nFormatter(stats.find(s => s.label.includes('Min'))?.value || 0)}</span>
                </span>
                <span class="stat-mini">
                    <span class="text-yellow-400">Max:</span>
                    <span class="text-white">{nFormatter(stats.find(s => s.label.includes('Max'))?.value || 0)}</span>
                </span>
            </div>
        </div>

        <div class="mb-4">
            <div class="flex justify-between text-sm mb-1">
                <span class="text-yellow-400">Progress:</span>
                <span class="progress-text" class:pulse-text={progressPercentage > 90}>
                    {progressPercentage.toFixed(1)}%
                </span>
            </div>
            <div class="progress-bar-container">
                <div class="progress-bar-bg">
                    <div 
                        class="progress-bar"
                        class:near-complete={progressPercentage > 90}
                        style="width: {Math.min(progressPercentage, 100)}%; 
                               background: {calculateProgressGradient(progressPercentage)}" 
                    />
                </div>
            </div>
            <div class="flex justify-between text-sm text-yellow-400 mt-1">
                <span>Raised: {asset.currentAmount}</span>
                <span>Target: {asset.targetAmount}</span>
            </div>
        </div>
    </div>

    <!-- Secondary Asset -->
    {#if (campaignType === 'multiassetlp' || campaignType === 'ergassetlp') && secondaryAsset}
        <div class="token-section mt-4">
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                    <div class="token-icon">
                        {#if secondaryAsset.iconUrl}
                            <img
                                src={secondaryAsset.iconUrl}
                                alt={secondaryAsset.name}
                                class="w-6 h-6 rounded-full"
                                on:error={() => (event.target.src = '/api/placeholder/24/24')}
                            />
                        {:else}
                            <span>{secondaryAsset.name[0]}</span>
                        {/if}
                    </div>
                    <span class="text-white font-medium">{secondaryAsset.name}</span>
                    {#if showTokenId && secondaryAsset?.tokenId}
                        <button 
                            class="asset-id hover:opacity-80"
                            on:click={() => copyToClipboard(secondaryAsset.tokenId, 'Token ID')}
                        >
                            ({formatAddress(secondaryAsset.tokenId, 6)})
                        </button>
                    {/if}
                </div>
                <div class="flex items-center gap-3 text-xs">
                    <span class="stat-mini">
                        <span class="text-yellow-400">Min:</span>
                        <span class="text-white">{nFormatter(secondaryAsset.minAmount || 0)}</span>
                    </span>
                    <span class="stat-mini">
                        <span class="text-yellow-400">Max:</span>
                        <span class="text-white">{nFormatter(secondaryAsset.maxAmount || 0)}</span>
                    </span>
                </div>
            </div>

            <div>
                <div class="flex justify-between text-sm mb-1">
                    <span class="text-yellow-400">Progress:</span>
                    <span class="progress-text" class:pulse-text={secondaryProgressPercentage > 90}>
                        {secondaryProgressPercentage.toFixed(1)}%
                    </span>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar-bg">
                        <div 
                            class="progress-bar"
                            class:near-complete={secondaryProgressPercentage > 90}
                            style="width: {Math.min(secondaryProgressPercentage, 100)}%; 
                                   background: {calculateProgressGradient(secondaryProgressPercentage)}" 
                        />
                    </div>
                </div>
                <div class="flex justify-between text-sm text-yellow-400 mt-1">
                    <span>Raised: {secondaryAsset.currentAmount}</span>
                    <span>Target: {secondaryAsset.targetAmount}</span>
                </div>
            </div>

            {#if estimatedPrice}
                <div class="price-estimate-container mt-3" transition:slide={{ duration: 300 }}>
                    <div class="flex justify-between text-sm">
                        <span class="text-yellow-400">Estimated Initial Price:</span>
                        <span class="text-white">
                            1 {asset.name} = {estimatedPrice} {secondaryAsset.name}
                        </span>
                    </div>
                </div>
            {/if}
        </div>
    {/if}

    <!-- Pool ID Section -->
    {#if ['mintpluslp', 'multiassetlp'].includes(campaignType) && status === 'ended' && poolId}
        <div class="pool-section">
            <button 
                class="pool-link-card"
                on:click={() => copyToClipboard(poolId, 'Pool ID')}
            >
                <div class="fee-label">Pool ID</div>
                <div class="pool-value">{formatAddress(poolId, 12)}</div>
            </button>
        </div>
    {/if}

    <!-- Fees and Dates Section -->
    <div class="fees-section">
        {#if campaignType === 'mintpluslp' || campaignType === 'multiassetlp' || campaignType === 'ergassetlp'}
            <div class="fees-grid">
                <div class="fee-card hover:scale-105">
                    <div class="fee-label">LP Fee</div>
                    <div class="fee-value">{stats.find(s => s.label === 'LP Fee')?.value || 3}%</div>
                </div>
                <div class="fee-card hover:scale-105">
                    <div class="fee-label">Mew Fee</div>
                    <div class="fee-value">1%</div>
                </div>
                <div class="fee-card hover:scale-105">
                    <div class="fee-label">Mew LP Fee</div>
                    <div class="fee-value">3%</div>
                </div>
            </div>
        {/if}
        
        <div class="dates-grid" class:mt-0={campaignType === 'crowdfund'}>
            <div class="fee-card hover:scale-105">
                <div class="fee-label">Start Date</div>
                <div class="date-value">{formatDateTime(startDate)}</div>
            </div>
            <div class="fee-card hover:scale-105">
                <div class="fee-label">End Date</div>
                <div class="date-value">{formatDateTime(endDate)}</div>
            </div>
        </div>
    </div>
</div>

<style>
    .asset-container {
        border-radius: 0.75rem;
        padding: 1rem;
        margin-bottom: 10px;
        background-color: var(--forms-bg);
        transition: all 0.3s ease;
        position: relative;
    }

    .updating {
        animation: highlight 0.6s ease-out;
    }

    @keyframes highlight {
        0% { background-color: rgba(255, 215, 0, 0.1); }
        100% { background-color: var(--forms-bg); }
    }

    .copied-tooltip {
        position: absolute;
        top: -40px;
        left: 50%;
        transform: translateX(-50%);
        background-color: var(--main-color);
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        z-index: 50;
    }

    .token-icon {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 0.875rem;
        transition: all 0.3s ease;
    }

    .token-icon.main-color {
        background-color: var(--main-color);
    }

    .token-icon.pulse {
        animation: iconPulse 2s infinite;
    }

    @keyframes iconPulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
    }

    .progress-bar-container {
        position: relative;
    }

    .progress-bar-bg {
        width: 100%;
        height: 0.5rem;
        background-color: rgba(0, 0, 0, 0.2);
        border-radius: 9999px;
        overflow: hidden;
    }

    .progress-bar {
        height: 100%;
        border-radius: 9999px;
        transition: width 0.5s ease;
    }

    .progress-bar.near-complete {
        animation: progressPulse 2s infinite;
    }

    @keyframes progressPulse {
        0% { opacity: 1; }
        50% { opacity: 0.7; }
        100% { opacity: 1; }
    }

    .pulse-text {
        animation: textPulse 2s infinite;
    }

    @keyframes textPulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.05); opacity: 0.8; }
        100% { transform: scale(1); opacity: 1; }
    }

    .price-estimate-container {
        background-color: rgba(0, 0, 0, 0.2);
        padding: 1rem;
        border-radius: 0.5rem;
        transition: all 0.3s ease;
        cursor: pointer;
    }

    .price-estimate-container:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .asset-id {
        color: var(--main-color);
        font-size: 0.875rem;
        text-decoration: none;
        transition: all 0.2s ease;
        cursor: pointer;
        border: none;
        background: none;
        padding: 0;
    }

    .asset-id:hover {
        opacity: 0.8;
        transform: translateY(-1px);
    }

    .token-section + .token-section {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid rgba(255, 215, 0, 0.1);
    }

    .stat-mini {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        background-color: rgba(0, 0, 0, 0.2);
        padding: 0.25rem 0.5rem;
        border-radius: 0.375rem;
        transition: all 0.2s ease;
    }

    .stat-mini:hover {
        transform: translateY(-1px);
        background-color: rgba(0, 0, 0, 0.3);
    }

    .fees-section {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid rgba(255, 215, 0, 0.2);
    }

    .fees-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.75rem;
    }

    .fee-card {
        background-color: rgba(0, 0, 0, 0.2);
        padding: 0.75rem;
        border-radius: 0.5rem;
        text-align: center;
        border: 1px solid rgba(255, 255, 255, 0.1);
        transition: all 0.3s ease;
        cursor: pointer;
    }

    .fee-card:hover {
        border-color: var(--main-color);
        transform: translateY(-2px);
    }

    .fee-label {
        color: var(--main-color);
        font-size: 0.75rem;
        margin-bottom: 0.25rem;
    }

    .fee-value {
        color: white;
        font-size: 1rem;
        font-weight: 600;
    }

    .dates-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.75rem;
        margin-top: 0.75rem;
    }

    .date-value {
        color: white;
        font-size: 0.75rem;
        font-weight: 500;
        word-break: keep-all;
        white-space: nowrap;
    }

    .pool-section {
        margin-top: 0.75rem;
        padding-top: 0.75rem;
        border-top: 1px solid rgba(255, 215, 0, 0.2);
    }

    .pool-link-card {
        width: 100%;
        background-color: rgba(0, 0, 0, 0.2);
        padding: 0.75rem;
        border-radius: 0.5rem;
        text-align: center;
        border: 1px solid rgba(255, 255, 255, 0.1);
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .pool-link-card:hover {
        transform: translateY(-2px);
        border-color: var(--main-color);
    }

    .pool-value {
        color: white;
        font-size: 0.875rem;
        font-weight: 500;
        word-break: break-all;
    }

    /* Responsive Styles */
    @media (max-width: 640px) {
        .asset-container {
            padding: 0.75rem;
        }

        .stat-mini {
            padding: 0.125rem 0.375rem;
            font-size: 0.7rem;
        }

        .fee-card {
            padding: 0.5rem;
        }

        .fee-value {
            font-size: 0.875rem;
        }
    }

    @media (max-width: 480px) {
        .fee-label {
            font-size: 0.7rem;
        }

        .date-value {
            font-size: 0.7rem;
        }

        .price-estimate-container {
            padding: 0.75rem;
            background-color: var(--footer);
        }

        .pool-value {
            font-size: 0.75rem;
        }
    }
</style>