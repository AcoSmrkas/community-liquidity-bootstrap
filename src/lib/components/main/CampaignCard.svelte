<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    
    export let campaign;
    let intervalId;
    let isRefreshing = false;

    // Types
    type CampaignType = 'TOTAL_VOLUME' | 'HIGHEST_BUYER' | 'HIGHEST_SELLER' | 'TRADE_COUNT';

    interface CampaignTypeInfo {
        title: string;
        description: string;
        sortField: string;
        icon: string;
        color: string;
        getLeaderValue: (trader: any) => number;
    }

    interface Trader {
        address: string;
        total_volume: number;
        usd_spent: number;
        usd_received: number;
        trade_count: number;
        buy_count?: number;
        sell_count?: number;
    }

    const CAMPAIGN_TYPES: Record<CampaignType, CampaignTypeInfo> = {
        'TOTAL_VOLUME': {
            title: 'Total Volume',
            description: 'Highest combined volume wins',
            sortField: 'total_volume',
            icon: '📊',
            color: 'var(--main-color)',
            getLeaderValue: (trader: Trader) => trader.total_volume || 0
        },
        'HIGHEST_BUYER': {
            title: 'Biggest Buyer',
            description: 'Highest buy volume wins',
            sortField: 'usd_spent',
            icon: '🐂',
            color: 'var(--main-color-buttons)',
            getLeaderValue: (trader: Trader) => trader.usd_spent || 0
        },
        'HIGHEST_SELLER': {
            title: 'Biggest Seller',
            description: 'Highest sell volume wins',
            sortField: 'usd_received',
            icon: '🐻',
            color: 'var(--info-color)',
            getLeaderValue: (trader: Trader) => trader.usd_received || 0
        },
        'TRADE_COUNT': {
            title: 'Most Active',
            description: 'Highest number of trades wins',
            sortField: 'trade_count',
            icon: '🎯',
            color: 'var(--secondary-color)',
            getLeaderValue: (trader: Trader) => trader.trade_count || 0
        }
    };

    // Helper Functions
    function formatAddress(address: string): string {
        if (!address) return '';
        return `${address.slice(0, 3)}...${address.slice(-3)}`;
    }

    function nFormatter(num: number, digits = 2) {
    if (!num) return '0';
    const lookup = [
        { value: 1, symbol: "" },
        { value: 1e3, symbol: "K" },
        { value: 1e6, symbol: "M" },
        { value: 1e9, symbol: "B" },
        { value: 1e12, symbol: "T" }
    ];
    const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
    const item = lookup.slice().reverse().find(item => num >= item.value);
    return item ? Number((num / item.value).toFixed(digits)).toString().replace(rx, "$1") + item.symbol : Number(num).toFixed(digits);
}

    function formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    function getFilteredTraders(traders: Trader[] = [], type: CampaignType): Trader[] {
        if (!traders?.length) return [];
        
        const typeInfo = CAMPAIGN_TYPES[type] || CAMPAIGN_TYPES['TOTAL_VOLUME'];
        
        switch(type) {
            case 'HIGHEST_SELLER':
                // Only include traders who have sold (usd_received > 0)
                return [...traders]
                    .filter(t => t.usd_received > 0)
                    .sort((a, b) => (b.usd_received || 0) - (a.usd_received || 0));
            
            case 'HIGHEST_BUYER':
                // Only include traders who have bought (usd_spent > 0)
                return [...traders]
                    .filter(t => t.usd_spent > 0)
                    .sort((a, b) => (b.usd_spent || 0) - (a.usd_spent || 0));
            
            case 'TRADE_COUNT':
                // Sort by total trades
                return [...traders]
                    .filter(t => t.trade_count > 0)
                    .sort((a, b) => (b.trade_count || 0) - (a.trade_count || 0));
            
            case 'TOTAL_VOLUME':
            default:
          
                return [...traders]
                    .filter(t => t.total_volume > 0)
                    .sort((a, b) => (b.total_volume || 0) - (a.total_volume || 0));
        }
    }


    async function refreshStats() {
        isRefreshing = true;
        await updateCampaignStats();
        setTimeout(() => {
            isRefreshing = false;
        }, 1000);
    }

    async function updateCampaignStats() {
        try {
            const volumeUrl = `https://stats.mewfinance.com/dex/campaigns/TokenVol.php?` + 
                             `token_id=${campaign.featured_token_id}&` +
                             `start_date=${encodeURIComponent(campaign.start_time_formatted)}&` +
                             `end_date=${encodeURIComponent(campaign.end_time_formatted)}&` +
                             `min_trade_vol=${campaign.min_trade_volume}&` +
                             `max_trade_vol=${campaign.max_trade_volume}`;

            const response = await fetch(volumeUrl);
            if (!response.ok) {
                throw new Error('Failed to fetch stats');
            }

            const data = await response.json();

            // Process trades to count buys/sells
            const traders = (data.top_traders || []).map(trader => ({
                ...trader,
                buy_count: trader.trades?.filter(t => t.type === 'buy').length || 0,
                sell_count: trader.trades?.filter(t => t.type === 'sell').length || 0
            }));

            campaign = {
                ...campaign,
                total_participants: data.total_unique_traders ?? 0,
                total_tokens_bought: data.total_tokens_bought ?? 0,
                total_tokens_sold: data.total_tokens_sold ?? 0,
                total_usd_spent: data.total_usd_spent ?? 0,
                total_usd_received: data.total_usd_received ?? 0,
                top_traders: traders,
                total_volume: data.total_volume ?? 0
            };
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }

    // Set default campaign type if not provided
    $: {
        if (!campaign.campaign_type || !CAMPAIGN_TYPES[campaign.campaign_type as CampaignType]) {
            campaign = {
                ...campaign,
                campaign_type: 'TOTAL_VOLUME' as CampaignType
            };
        }
    }

    // Reactive declarations
    $: typeInfo = CAMPAIGN_TYPES[campaign.campaign_type as CampaignType];
    $: filteredTraders = getFilteredTraders(campaign.top_traders, campaign.campaign_type as CampaignType);

    onMount(() => {
        updateCampaignStats();
        intervalId = setInterval(updateCampaignStats, 30000);
    });

    onDestroy(() => {
        if (intervalId) clearInterval(intervalId);
    });
</script>
<div class="campaign-card">
    <!-- Campaign Header -->
    <div class="campaign-header">
        <div class="header-main">
            <div class="campaign-type" style="--type-color: {typeInfo.color}">
                <span class="type-icon">{typeInfo.icon}</span>
                <span class="type-title">{typeInfo.title}</span>
            </div>
            <h3 class="campaign-name">{campaign.name}</h3>
            <p class="campaign-description">{campaign.description}</p>
        </div>
        <div class="header-actions">
            <button 
                on:click={refreshStats}
                class="refresh-btn"
                class:animate-spin={isRefreshing}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
                    <path d="M21 3v5h-5"/>
                </svg>
            </button>
            <div class="status-badge">Active</div>
        </div>
    </div>

    <!-- Campaign Info Grid -->
    <div class="info-grid">
        <div class="info-item">
            <span class="info-label">Start</span>
            <div class="info-value">{formatDate(campaign.start_time)}</div>
        </div>
        <div class="info-item">
            <span class="info-label">End</span>
            <div class="info-value">{formatDate(campaign.end_time)}</div>
        </div>
        <div class="info-item">
            <span class="info-label">Min Trade</span>
            <div class="info-value">${nFormatter(campaign.min_trade_volume)}</div>
        </div>
        <div class="info-item">
            <span class="info-label">Max Trade</span>
            <div class="info-value">${nFormatter(campaign.max_trade_volume)}</div>
        </div>
    </div>

    <!-- Leaderboard Section -->
    <div class="leaderboard">
        <div class="leaderboard-header">
            <h4 class="leaderboard-title">Leaderboard</h4>
            {#if campaign.campaign_type !== 'TOTAL_VOLUME'}
                <div class="leaderboard-subtitle">{typeInfo.description}</div>
            {/if}
        </div>

        <!-- Desktop Leaderboard -->
        <div class="desktop-leaderboard">
            <div class="leaderboard-columns">
                <div>#</div>
                <div>Trader</div>
                {#if campaign.campaign_type === 'HIGHEST_SELLER'}
                    <div class="text-right">Sell Volume</div>
                    <div class="text-right">Sell Count</div>
                {:else if campaign.campaign_type === 'HIGHEST_BUYER'}
                    <div class="text-right">Buy Volume</div>
                    <div class="text-right">Buy Count</div>
                {:else if campaign.campaign_type === 'TRADE_COUNT'}
                    <div class="text-right">Trades</div>
                    <div class="text-right">Volume</div>
                {:else}
                    <div class="text-right">Volume</div>
                    <div class="text-right">Trades</div>
                {/if}
            </div>

            {#if filteredTraders.length}
                {#each filteredTraders.slice(0, 15) as trader, i}
                    <div class="leaderboard-row">
                        <div class="rank">#{i + 1}</div>
                        <div class="trader">{formatAddress(trader.address)}</div>
                        {#if campaign.campaign_type === 'HIGHEST_SELLER'}
                            <div class="value sell">${nFormatter(trader.usd_received)}</div>
                            <div class="count">{trader.sell_count || 0}</div>
                        {:else if campaign.campaign_type === 'HIGHEST_BUYER'}
                            <div class="value buy">${nFormatter(trader.usd_spent)}</div>
                            <div class="count">{trader.buy_count || 0}</div>
                        {:else if campaign.campaign_type === 'TRADE_COUNT'}
                            <div class="value">{trader.total_trades}</div>
                            <div class="volume">${nFormatter(trader.total_volume)}</div>
                        {:else}
                            <div class="value">${nFormatter(trader.total_volume)}</div>
                            <div class="count">{trader.total_trades}</div>
                        {/if}
                    </div>
                {/each}
            {:else}
                <div class="no-trades">No trades yet</div>
            {/if}
        </div>

        <!-- Mobile Leaderboard -->
        <div class="mobile-leaderboard">
            {#if filteredTraders.length}
                {#each filteredTraders.slice(0, 15) as trader, i}
                    <div class="mobile-row">
                        <div class="mobile-main">
                            <div class="rank">#{i + 1}</div>
                            <div class="trader">{formatAddress(trader.address)}</div>
                            <div class="value">
                                ${nFormatter(typeInfo.getLeaderValue(trader))}
                            </div>
                        </div>
                    </div>
                {/each}
            {:else}
                <div class="no-trades">No trades yet</div>
            {/if}
        </div>
    </div>

    <!-- Campaign Stats -->
    <div class="stats-grid">
        {#if campaign.campaign_type === 'HIGHEST_SELLER'}
            <div class="stats-item">
                <span class="stats-label">Total Tokens Sold</span>
                <div class="stats-value">{nFormatter(campaign.total_tokens_sold)}</div>
            </div>
            <div class="stats-item">
                <span class="stats-label">Total USD Received</span>
                <div class="stats-value">${nFormatter(campaign.total_usd_received)}</div>
            </div>
            <div class="stats-item">
                <span class="stats-label">Top Seller</span>
                <div class="stats-value">
                    {filteredTraders.length ? formatAddress(filteredTraders[0].address) : '-'}
                </div>
            </div>
            <div class="stats-item">
                <span class="stats-label">Top Seller's Sell Volume</span>
                <div class="stats-value">${nFormatter(filteredTraders.length ? filteredTraders[0].usd_received : 0)}</div>
            </div>
        {:else if campaign.campaign_type === 'HIGHEST_BUYER'}
            <div class="stats-item">
                <span class="stats-label">Total Tokens Bought</span>
                <div class="stats-value">{nFormatter(campaign.total_tokens_bought)}</div>
            </div>
            <div class="stats-item">
                <span class="stats-label">Total USD Spent</span>
                <div class="stats-value">${nFormatter(campaign.total_usd_spent)}</div>
            </div>
            <div class="stats-item">
                <span class="stats-label">Top Buyer</span>
                <div class="stats-value">
                    {filteredTraders.length ? formatAddress(filteredTraders[0].address) : '-'}
                </div>
            </div>
            <div class="stats-item">
                <span class="stats-label">Top Buyer's Buy Volume</span>
                <div class="stats-value">${nFormatter(filteredTraders.length ? filteredTraders[0].usd_spent : 0)}</div>
            </div>
        {:else if campaign.campaign_type === 'TRADE_COUNT'}
            <div class="stats-item">
                <span class="stats-label">Total Trades</span>
                <div class="stats-value">{nFormatter(campaign.type_stats.total_trades)}</div>
            </div>
            <div class="stats-item">
                <span class="stats-label">Top Trader</span>
                <div class="stats-value">
                    {filteredTraders.length ? formatAddress(filteredTraders[0].address) : '-'}
                </div>
            </div>
            <div class="stats-item">
                <span class="stats-label">Top Trader's Trade Count</span>
                <div class="stats-value">{filteredTraders.length ? filteredTraders[0].total_trades : 0}</div>
            </div>
        {:else}
            <div class="stats-item">
                <span class="stats-label">Total Volume</span>
                <div class="stats-value">${nFormatter(campaign.total_volume)}</div>
            </div>
            <div class="stats-item">
                <span class="stats-label">Participants</span>
                <div class="stats-value">{campaign.total_participants}</div>
            </div>
            <div class="stats-item">
                <span class="stats-label">Reward</span>
                <div class="stats-value">{nFormatter(campaign.total_reward_amount)} {campaign.reward_token.toUpperCase()}</div>
            </div>
        {/if}
    </div>
</div>
<style>
 .campaign-card {
    background-color: var(--forms-bg);
    border: 1px solid var(--borders);
    border-radius: 0.5rem;
    overflow: hidden;
    padding: 1rem;
}

/* Header Styles */
.campaign-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.header-main {
    flex: 1;
}

.campaign-type {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: color-mix(in srgb, var(--type-color) 15%, transparent);
    color: var(--type-color);
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
}

.campaign-name {
    color: var(--secondary-color);
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 0.25rem 0;
}

.campaign-description {
    color: var(--text-light);
    font-size: 0.75rem;
    margin: 0;
}

.header-actions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

.refresh-btn {
    padding: 0.375rem;
    border-radius: 0.375rem;
    color: var(--text-light);
    background: transparent;
    border: 1px solid var(--borders);
    cursor: pointer;
    transition: all 0.2s;
}

.refresh-btn:hover {
    background: var(--footer);
}

.status-badge {
    background: var(--main-color);
    color: var(--background);
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
}

/* Info Grid */
.info-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
    margin-bottom: 1rem;
}

.info-item {
    background: var(--footer);
    padding: 0.5rem;
    border-radius: 0.375rem;
}

.info-label {
    color: var(--text-light);
    font-size: 0.625rem;
}

.info-value {
    color: var(--secondary-color);
    font-size: 0.875rem;
    margin-top: 0.125rem;
}

/* Leaderboard */
.leaderboard {
    margin-bottom: 1rem;
}

.leaderboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
}

.leaderboard-title {
    color: var(--secondary-color);
    font-size: 0.875rem;
    font-weight: 500;
    margin: 0;
}

.leaderboard-subtitle {
    color: var(--text-light);
    font-size: 0.75rem;
}

.desktop-leaderboard {
    display: none;
}

@media (min-width: 768px) {
    .desktop-leaderboard {
        display: block;
    }
    .mobile-leaderboard {
        display: none;
    }
}

.leaderboard-columns {
    display: grid;
    grid-template-columns: 2rem minmax(120px, 1fr) repeat(4, auto);
    gap: 1rem;
    padding: 0.5rem;
    color: var(--text-light);
    font-size: 0.75rem;
}

.leaderboard-row {
    display: grid;
    grid-template-columns: 2rem minmax(120px, 1fr) repeat(4, auto);
    gap: 1rem;
    padding: 0.5rem;
    background: var(--footer);
    border-radius: 0.375rem;
    margin-bottom: 0.25rem;
    font-size: 0.875rem;
    align-items: center;
}

.rank {
    color: var(--main-color);
    font-weight: 500;
}

.trader {
    color: var(--secondary-color);
    font-family: monospace;
}

.value {
    color: var(--secondary-color);
    text-align: right;
}

.value.buy {
    color: var(--main-color);
}

.value.sell {
    color: var(--info-color);
}

.count {
    color: var(--text-light);
    text-align: right;
}

/* Mobile Leaderboard */
.mobile-row {
    background: var(--footer);
    border-radius: 0.375rem;
    padding: 0.5rem;
    margin-bottom: 0.25rem;
}

.mobile-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.375rem;
}

.no-trades {
    text-align: center;
    color: var(--text-light);
    padding: 1rem;
    font-size: 0.875rem;
}

/* Stats Grid */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
}

.stats-item {
    background: var(--footer);
    padding: 0.5rem;
    border-radius: 0.375rem;
}

.stats-label {
    color: var(--text-light);
    font-size: 0.625rem;
}

.stats-value {
    color: var(--secondary-color);
    font-size: 0.875rem;
    margin-top: 0.125rem;
}

/* Animation */
.animate-spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
    .campaign-card {
        padding: 0.75rem;
    }

    .info-grid,
    .stats-grid {
        grid-template-columns: repeat(2, 1fr);
    }

    .campaign-name {
        font-size: 0.875rem;
    }

    .campaign-description {
        font-size: 0.75rem;
    }
}
</style>