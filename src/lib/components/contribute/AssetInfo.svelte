<script>
    export let asset = {
        name: '',
        iconUrl: '',
        tokenId: '',
        currentAmount: 0,
        targetAmount: 0,
        progress: 0
    };
    export let accentColor = 'blue';
    export let showTokenId = false;

    import { formatAddress } from '$lib/utils/utils.js';

    // Calculate progress percentage and status
    $: progressPercentage = (asset.currentAmount / asset.targetAmount) * 100;
    $: isTargetReached = asset.currentAmount >= asset.targetAmount;
</script>

<div class="asset-container">
    <div class="flex items-center gap-2 mb-3">
        {#if asset.iconUrl}
            <img 
                src={asset.iconUrl} 
                alt={asset.name} 
                class="w-6 h-6 rounded-full"
                on:error={() => (event.target.src = '/api/placeholder/24/24')} 
            />
        {:else}
            <img 
                src="/api/placeholder/24/24" 
                alt={asset.name}
                class="w-6 h-6 rounded-full"
            />
        {/if}
        <span class="asset-name">{asset.name}</span>
        {#if showTokenId && asset.tokenId}
            <span class="asset-id">({formatAddress(asset.tokenId, 6)})</span>
        {/if}
    </div>
    
    <div class="progress-container">
        <div class="progress-header">
            <span class="label">Progress:</span>
            <span 
                class="value"
                style="color: {isTargetReached ? 'green' : 'red'}">
                {isTargetReached 
                    ? `${progressPercentage.toFixed(1)}%` 
                    : `${progressPercentage.toFixed(1)}%`}
            </span>
        </div>
        <div class="progress-bar-bg">
            <div class="progress-bar" style="width: {Math.min(progressPercentage, 100)}%" />
        </div>
        <div class="progress-details">
            <span class="detail">
                Raised: {asset.currentAmount.toLocaleString()} 
            </span>
            <span class="detail">
                Target: {asset.targetAmount.toLocaleString()} 
            </span>
        </div>
    </div>
</div>

<style>
    .asset-container {
        background-color: var(--footer);
        padding: 1rem;
        border-radius: 0.75rem;
        border: 1px solid var(--main-color);
        border-left: 4px solid var(--main-color);
    }

    .asset-name {
        color: white;
        font-weight: 500;
    }

    .asset-id {
        color: var(--main-color);
        font-size: 0.875rem;
    }

    .progress-container {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .progress-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .label {
        color: var(--main-color);
        font-size: 0.875rem;
    }

    .value {
        font-weight: bold;
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
        background-color: var(--main-color);
        border-radius: 9999px;
        transition: width 0.5s ease;
    }

    .progress-details {
        display: flex;
        justify-content: space-between;
        font-size: 0.875rem;
    }

    .detail {
        color: var(--main-color);
    }
</style>
