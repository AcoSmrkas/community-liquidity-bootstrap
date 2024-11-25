<script>
    import CopyableAddress from './CopyableAddress.svelte';
    import CampaignStats from './CampaignStats.svelte';
    export let campaign;
</script>

<div class="results-container">
    <h3 class="results-title">Campaign Results</h3>
    <div class="results-content">
        {#each campaign.contributions || [] as contribution}
            <div class="result-item">
                <span class="result-label">Total Raised:</span>
                <span class="result-value">
                    {contribution.amount}
                    {contribution.asset === campaign.base_token_id ? campaign.base_name : 'ERG'}
                </span>
            </div>
        {/each}

        <!-- Display minted token ID for MintPlusLP type -->
        {#if campaign.campaign_type === 'mintpluslp' && campaign.token_id}
            <div class="result-item">
                <CopyableAddress
                    label="Minted Token ID"
                    address={campaign.token_id}
                />
            </div>
        {/if}

        <!-- Display LP token ID for both types -->
        {#if campaign.lp_tokenid}
            <div class="result-item">
                <CopyableAddress
                    label="LP Token ID"
                    address={campaign.lp_tokenid}
                />
            </div>
        {/if}

        <!-- Display MewFinance link if LP token exists -->
        {#if campaign.lp_tokenid}
            <div class="result-item">
                <div class="flex flex-col gap-1 w-full">
                    <a
                        href={`https://dex.mewfinance.com/ergo/liquidity/${campaign.lp_tokenid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                        View on MewFinance →
                    </a>
                </div>
            </div>
        {/if}

        {#if campaign.lp_tokenid}
            <div class="lp-container">
                <CampaignStats
                    stats={[
                        {
                            label: 'Total LP Share',
                            value: campaign.total_lp_share,
                            format: 'number'
                        },
                        {
                            label: 'LP Fee',
                            value: campaign.lp_fee,
                            format: 'percentage'
                        }
                    ]}
                    columns={2}
                />
            </div>
        {/if}
    </div>
</div>

<style>
    .results-container {
        background-color: var(--footer);
        border-radius: 0.75rem;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        border: 1px solid var(--main-color);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        position: relative;
        overflow: hidden;
    }
    .results-title {
        color: var(--main-color);
        font-size: 1.25rem;
        font-weight: 600;
        margin-bottom: 1rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    .results-content {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    .result-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem;
        background-color: rgba(0, 0, 0, 0.2);
        border-radius: 0.5rem;
        transition: transform 0.2s ease;
    }
    .result-item:hover {
        transform: translateX(4px);
    }
    .result-label {
        color: var(--main-color);
        font-size: 0.875rem;
        font-weight: 500;
    }
    .result-value {
        color: white;
        font-weight: 500;
        font-size: 0.875rem;
        font-family: 'Inter', sans-serif;
    }
    .lp-container {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
</style>