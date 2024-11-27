<script>
    import { formatAddress, nFormatter } from '$lib/utils/utils.js';
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
    export let poolId = '';  // LP token ID / Pool ID
    export let endDate = '';
    export let campaignType = ''; // Add campaign type
    export let totalSupply = 0;   // Add total supply for mintpluslp
    export let initialPrice = 0;  // Add initial price for mintpluslp

    $: progressPercentage = (asset.currentAmount / asset.targetAmount) * 100;
    $: secondaryProgressPercentage = secondaryAsset ? 
        (secondaryAsset.currentAmount / secondaryAsset.targetAmount) * 100 : 0;
    
    function formatDateTime(dateTimeString) {
        if (!dateTimeString) return '';
        const date = new Date(dateTimeString);
        return date.toLocaleDateString() + ' ' + 
               date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
</script>

<div class="asset-container">
    <!-- Primary Asset -->
    <div class="token-section">
        <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
                <div class="token-icon main-color">
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
                <a 
                    href="https://ergexplorer.com/token/{asset.tokenId}" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    class="asset-id hover:opacity-80"
                >
                    ({formatAddress(asset.tokenId, 6)})
                </a>
            {/if}
            </div>
            <!-- Compact min/max display -->
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
                <span class="progress-text">{progressPercentage.toFixed(1)}%</span>
            </div>
            <div class="progress-bar-bg">
                <div 
                    class="progress-bar"
                    style="width: {Math.min(progressPercentage, 100)}%" 
                />
            </div>
            <div class="flex justify-between text-sm text-yellow-400 mt-1">
                <span>Raised: {asset.currentAmount.toLocaleString()}</span>
                <span>Target: {asset.targetAmount.toLocaleString()}</span>
            </div>
        </div>
    </div>

    <!-- Secondary Asset -->
    {#if campaignType === 'multiassetlp' && secondaryAsset}
        <div class="token-section">
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                    <div class="token-icon main-color">
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
    <a 
        href="https://ergexplorer.com/token/{secondaryAsset.tokenId}" 
        target="_blank" 
        rel="noopener noreferrer" 
        class="asset-id hover:opacity-80"
    >
        ({formatAddress(secondaryAsset.tokenId, 6)})
    </a>
{/if}
                </div>
                <!-- Compact min/max display for secondary asset -->
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
                    <span class="progress-text">{secondaryProgressPercentage.toFixed(1)}%</span>
                </div>
                <div class="progress-bar-bg">
                    <div 
                        class="progress-bar"
                        style="width: {Math.min(secondaryProgressPercentage, 100)}%" 
                    />
                </div>
                <div class="flex justify-between text-sm text-yellow-400 mt-1">
                    <span>Raised: {secondaryAsset.currentAmount.toLocaleString()}</span>
                    <span>Target: {secondaryAsset.targetAmount.toLocaleString()}</span>
                </div>
            </div>
        </div>
    {/if}
{#if ['mintpluslp', 'multiassetlp'].includes(campaignType) && status === 'ended' && poolId}
    <div class="pool-section">
        <a 
            href="https://dex.mewfinance.com/ergo/liquidity/{poolId}"
            target="_blank"
            rel="noopener noreferrer"
            class="pool-link-card"
        >
            <div class="fee-label">Pool ID</div>
            <div class="pool-value">{formatAddress(poolId, 12)}</div>
        </a>
    </div>
{/if}
   <!-- Common Fees and Dates Section -->
<div class="fees-section">
    {#if campaignType === 'mintpluslp' || campaignType === 'multiassetlp' || campaignType === 'ergassetlp'}
        <div class="fees-grid">
            <div class="fee-card">
                <div class="fee-label">LP Fee</div>
                <div class="fee-value">{stats.find(s => s.label === 'LP Fee')?.value || 3}%</div>
            </div>
            <div class="fee-card">
                <div class="fee-label">Mew Fee</div>
                <div class="fee-value">1%</div>
            </div>
            <div class="fee-card">
                <div class="fee-label">Mew LP Fee</div>
                <div class="fee-value">3%</div>
            </div>
        </div>
    {/if}
    
    <div class="dates-grid" class:mt-0={campaignType === 'crowdfund'}>
        <div class="fee-card">
            <div class="fee-label">Start Date</div>
            <div class="date-value">{formatDateTime(startDate)}</div>
        </div>
        <div class="fee-card">
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
    }
    .asset-id {
        color: var(--main-color);
        font-size: 0.875rem;
        text-decoration: none;
        transition: opacity 0.2s ease;
    }

    .asset-id:hover {
        text-decoration: underline;
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
    }

    .token-icon.main-color {
        background-color: var(--main-color);
    }
    .pool-section {
        margin-top: 0.75rem;
        padding-top: 0.75rem;
        border-top: 1px solid rgba(255, 215, 0, 0.2);
    }

    .pool-link-card {
        background-color: rgba(0, 0, 0, 0.2);
        padding: 0.75rem;
        border-radius: 0.5rem;
        text-align: center;
        border: 1px solid rgba(255, 255, 255, 0.1);
        display: block;
        text-decoration: none;
        transition: all 0.2s ease;
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

    @media (max-width: 480px) {
        .pool-value {
            font-size: 0.75rem;
        }
    }
    .progress-bar-bg {
        width: 100%;
        height: 0.5rem;
        background-color: rgba(0, 0, 0, 0.2);
        border-radius: 9999px;
        overflow: hidden;
    }
    .token-stats-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.75rem;
        margin-bottom: 1rem;
    }
    .progress-bar {
        height: 100%;
        border-radius: 9999px;
        transition: width 0.5s ease;
        background-color: var(--main-color);
    }

    .progress-text {
        color: var(--main-color);
    }

    .asset-id {
        color: var(--main-color);
        font-size: 0.875rem;
    }

    .token-section + .token-section {
        margin-top: 1rem;
    }

    .stat-mini {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        background-color: rgba(0, 0, 0, 0.2);
        padding: 0.25rem 0.5rem;
        border-radius: 0.375rem;
    }

    .stat-card {
        background-color: rgba(0, 0, 0, 0.2);
        padding: 0.75rem;
        border-radius: 0.5rem;
        border: 1px solid rgba(255, 255, 255, 0.1);
        transition: all 0.2s ease;
    }

    .stat-label {
        color: var(--main-color);
        font-size: 0.75rem;
        margin-bottom: 0.25rem;
    }

    .stat-value {
        color: white;
        font-size: 0.875rem;
        font-weight: 500;
        display: flex;
        align-items: baseline;
        gap: 0.25rem;
    }

    .stat-suffix {
        color: rgba(255, 255, 255, 0.8);
        font-size: 0.75rem;
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

    @media (max-width: 640px) {
        .stat-mini {
            padding: 0.125rem 0.375rem;
        }
        
        .stat-card {
            padding: 0.5rem;
        }

        .stat-label {
            font-size: 0.75rem;
        }

        .stat-value {
            font-size: 0.75rem;
        }
    }

    @media (max-width: 480px) {
        .fee-card {
            padding: 0.5rem;
        }
        
        .fee-label {
            font-size: 0.7rem;
        }
        
        .fee-value {
            font-size: 0.875rem;
        }

        .date-value {
            font-size: 0.7rem;
        }
    }
</style>