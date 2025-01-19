<script lang="ts">
    import { onMount, onDestroy } from 'svelte';

    interface Trade {
        txid: string;
        timestamp: string;
        address: string;
        token_id: string;
        trade_type: 'buy' | 'sell';
        trade_volume: number;
        token_amount: number;
        erg_amount: number;
        token_info?: {
            name: string;
            decimals: number;
            iconUrl?: string;
        };
    }

    interface TokenInfo {
        id: string;
        name: string;
        decimals: number;
        iconUrl?: string;
    }

    // State
    let trades: Trade[] = [];
    let filteredTrades: Trade[] = [];
    let isLoading = true;
    let error: string | null = null;
    let page = 1;
    let totalPages = 1;
    let isLoadingMore = false;
    let tokenInfoCache = new Map<string, TokenInfo>();
    let lastTxId = '';
    let selectedFilter: 'all' | 'buy' | 'sell' = 'all';
    let isRefreshing = false;

    // Auto-scroll settings
    let autoScroll = true;
    let scrollContainer: HTMLElement;

    $: {
        // Filter trades when selection or trades change
        filteredTrades = trades.filter(trade => {
            if (selectedFilter === 'all') return true;
            return trade.trade_type === selectedFilter;
        });
    }

    // Helper Functions
    function formatAddress(address: string): string {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-6)}`;
    }

    function formatNumber(num: number, decimals = 2): string {
        if (num === undefined || num === null) return '0';
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: decimals
        }).format(num);
    }

    function formatTimeAgo(timestamp: string): string {
        const date = new Date(timestamp);
        const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
        return `${Math.floor(seconds / 86400)}d`;
    }

    async function fetchTokenInfo(tokenId: string) {
        if (tokenInfoCache.has(tokenId)) {
            return tokenInfoCache.get(tokenId);
        }

        try {
            const response = await fetch('https://api.ergexplorer.com/tokens/byId', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: [tokenId] })
            });
            
            if (!response.ok) throw new Error('Failed to fetch token info');
            const data = await response.json();
            
            if (data.items && data.items[0]) {
                const tokenInfo = {
                    id: data.items[0].id,
                    name: data.items[0].name || formatAddress(data.items[0].id),
                    decimals: parseInt(data.items[0].decimals || '0'),
                    iconUrl: `https://raw.githubusercontent.com/spectrum-finance/token-logos/master/logos/ergo/${tokenId}.svg`
                };
                tokenInfoCache.set(tokenId, tokenInfo);
                return tokenInfo;
            }
            
            return null;
        } catch (error) {
            console.error('Error fetching token info:', error);
            return null;
        }
    }

    async function fetchLatestTrades(isInitial = false) {
        try {
            if (isInitial) {
                isLoading = true;
            }

            const response = await fetch(`https://stats.mewfinance.com/dex/campaigns/Trades?page=${page}&limit=30`);
            if (!response.ok) throw new Error('Failed to fetch trades');
            
            const data = await response.json();
            const newTrades = data.swaps || [];

            // Only process if we have new trades
            if (newTrades.length > 0 && (!lastTxId || newTrades[0].txid !== lastTxId)) {
                // Update last seen txid
                lastTxId = newTrades[0].txid;

                // Fetch token info for new trades
                const tradesWithInfo = await Promise.all(
                    newTrades.map(async (trade) => {
                        const tokenInfo = await fetchTokenInfo(trade.token_id);
                        return {
                            ...trade,
                            token_info: tokenInfo
                        };
                    })
                );

                if (isInitial || page === 1) {
                    trades = tradesWithInfo;
                } else {
                    trades = [...trades, ...tradesWithInfo];
                }

                totalPages = data.total_pages;

                // Auto-scroll to newest trade if enabled
                if (autoScroll && scrollContainer && page === 1) {
                    setTimeout(() => {
                        scrollContainer.scrollTo({ left: 0, behavior: 'smooth' });
                    }, 100);
                }
            }
        } catch (error) {
            console.error('Error:', error);
            error = error.message;
        } finally {
            isLoading = false;
            isLoadingMore = false;
            isRefreshing = false;
        }
    }

    async function handleRefresh() {
        if (isRefreshing) return;
        isRefreshing = true;
        page = 1;
        await fetchLatestTrades(true);
    }

    function toggleFilter(filter: typeof selectedFilter) {
        selectedFilter = filter;
    }

    function toggleAutoScroll() {
        autoScroll = !autoScroll;
    }

    async function loadMore() {
        if (isLoadingMore || page >= totalPages) return;
        
        isLoadingMore = true;
        page++;
        await fetchLatestTrades();
    }

    function handleScroll(event) {
        const element = event.target;
        const isNearEnd = element.scrollLeft >= element.scrollWidth - element.clientWidth - 300;
        
        if (isNearEnd && !isLoadingMore) {
            loadMore();
        }
    }

    // Lifecycle
    onMount(() => {
        fetchLatestTrades(true);
        const interval = setInterval(() => fetchLatestTrades(), 10000);
        return () => clearInterval(interval);
    });
</script>
<!-- Controls -->
<div class="trade-feed">
    <div class="controls">
        <div class="left-controls">
            <h2>Latest Trades</h2>
            <div class="filter-buttons">
                <button 
                    class="filter-btn {selectedFilter === 'all' ? 'active' : ''}"
                    on:click={() => toggleFilter('all')}
                >
                    All
                </button>
                <button 
                    class="filter-btn buy {selectedFilter === 'buy' ? 'active' : ''}"
                    on:click={() => toggleFilter('buy')}
                >
                    Buys
                </button>
                <button 
                    class="filter-btn sell {selectedFilter === 'sell' ? 'active' : ''}"
                    on:click={() => toggleFilter('sell')}
                >
                    Sells
                </button>
            </div>
        </div>
        
        <div class="right-controls">
            <button 
                class="control-btn {autoScroll ? 'active' : ''}"
                on:click={toggleAutoScroll}
                title="Auto-scroll to new trades"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="7 13 12 18 17 13"></polyline>
                    <polyline points="7 6 12 11 17 6"></polyline>
                </svg>
            </button>
            <button 
                class="control-btn refresh {isRefreshing ? 'spin' : ''}"
                on:click={handleRefresh}
                disabled={isRefreshing}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
                    <path d="M21 3v5h-5"/>
                </svg>
            </button>
        </div>
    </div>

    <!-- Trades Container -->
    <div 
        class="trades-container" 
        bind:this={scrollContainer}
        on:scroll={handleScroll}
    >
        {#if isLoading && trades.length === 0}
            <div class="loading">
                <div class="loader" />
            </div>
        {:else if error}
            <div class="error">{error}</div>
        {:else}
            <div class="trades-row">
                {#each filteredTrades as trade}
                    <div class="trade-card {trade.trade_type}">
                        <div class="trade-header">
                            <div class="token-info">
                                {#if trade.token_info?.iconUrl}
                                    <img 
                                        src={trade.token_info.iconUrl} 
                                        alt=""
                                        class="token-icon"
                                        on:error={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = `https://spectrum.fi/logos/ergo/${trade.token_id}.svg`;
                                        }}
                                    />
                                {:else}
                                    <div class="token-placeholder">
                                        {trade.token_info?.name?.charAt(0) || '?'}
                                    </div>
                                {/if}
                                <span class="token-name" title={trade.token_info?.name || trade.token_id}>
                                    {trade.token_info?.name || formatAddress(trade.token_id)}
                                </span>
                            </div>
                            <div class="trade-type-badge" class:buy={trade.trade_type === 'buy'} class:sell={trade.trade_type === 'sell'}>
                                {trade.trade_type === 'buy' ? '↗' : '↘'}
                            </div>
                        </div>

                        <div class="trade-details">
                            <div class="detail-row">
                                <span class="value amount">
                                    {formatNumber(trade.token_amount, trade.token_info?.decimals || 2)}
                                </span>
                            </div>
                            <div class="detail-row">
                                <span class="value price">${formatNumber(trade.trade_volume, 2)}</span>
                            </div>
                        </div>

                        <div class="trade-footer">
                            <a 
                                href={`https://explorer.ergoplatform.com/en/addresses/${trade.address}`} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                class="trader"
                            >
                                {formatAddress(trade.address)}
                            </a>
                            <span class="time">{formatTimeAgo(trade.timestamp)}</span>
                        </div>
                    </div>
                {/each}

                {#if isLoadingMore}
                    <div class="trade-card loading-card">
                        <div class="loader" />
                    </div>
                {/if}
            </div>
        {/if}
    </div>
</div>

<style>
    .trade-feed {
        width: 100%;
        padding: 1rem;
        background: var(--forms-bg);
        border-radius: 0.5rem;
    }

    .controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        padding: 0 0.5rem;
    }

    .left-controls {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .left-controls h2 {
        margin: 0;
        font-size: 1.25rem;
        color: var(--text);
    }

    .filter-buttons {
        display: flex;
        gap: 0.5rem;
    }

    .filter-btn {
        padding: 0.5rem 1rem;
        border: 1px solid var(--borders);
        background: var(--forms-bg);
        color: var(--text);
        border-radius: 0.25rem;
        cursor: pointer;
        font-size: 0.875rem;
        transition: all 0.2s;
    }

    .filter-btn:hover {
        border-color: var(--main-color);
    }

    .filter-btn.active {
        background: var(--main-color);
        color: var(--background);
        border-color: var(--main-color);
    }

    .filter-btn.buy.active {
        background: #4caf50;
        border-color: #4caf50;
    }

    .filter-btn.sell.active {
        background: #ff5252;
        border-color: #ff5252;
    }

    .right-controls {
        display: flex;
        gap: 0.5rem;
    }

    .control-btn {
        padding: 0.5rem;
        border: 1px solid var(--borders);
        background: var(--forms-bg);
        color: var(--text);
        border-radius: 0.25rem;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .control-btn:hover {
        border-color: var(--main-color);
    }

    .control-btn.active {
        background: var(--main-color);
        color: var(--background);
    }

    .control-btn.refresh.spin svg {
        animation: spin 1s linear infinite;
    }

    .trades-container {
        overflow-x: auto;
        padding: 0.5rem;
        position: relative;
    }

    .trades-row {
        display: flex;
        gap: 1rem;
        padding: 0.5rem;
    }

    .trade-card {
        flex: 0 0 300px;
        background: var(--footer);
        border: 1px solid var(--borders);
        border-radius: 0.5rem;
        padding: 1rem;
        transition: transform 0.2s;
    }

    .trade-card:hover {
        transform: translateY(-2px);
    }

    .trade-card.buy {
        border-left: 4px solid #4caf50;
    }

    .trade-card.sell {
        border-left: 4px solid #ff5252;
    }

    .trade-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;
    }

    .token-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .token-icon {
        width: 24px;
        height: 24px;
        border-radius: 50%;
    }

    .token-placeholder {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: var(--main-color);
        color: var(--background);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        font-weight: 600;
    }

    .token-name {
        color: var(--text);
        font-weight: 500;
        max-width: 180px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .trade-type-badge {
        font-size: 1.25rem;
        line-height: 1;
    }

    .trade-type-badge.buy {
        color: #4caf50;
    }

    .trade-type-badge.sell {
        color: #ff5252;
    }

    .trade-details {
        text-align: center;
        margin: 0.75rem 0;
    }

    .value {
        font-family: monospace;
        font-size: 1rem;
    }

    .value.amount {
        color: var(--text);
    }

    .value.price {
        color: var(--info-color);
    }

    .trade-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.75rem;
        color: var(--text-light);
    }

    .trader {
        color: var(--info-color);
        text-decoration: none;
    }

    .trader:hover {
        text-decoration: underline;
    }

    .loading-card {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .loader {
        width: 24px;
        height: 24px;
        border: 2px solid var(--borders);
        border-top-color: var(--main-color);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
        .controls {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
        }

        .left-controls {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
        }
    }
</style>