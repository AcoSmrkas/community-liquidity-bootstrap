<script lang="ts">
    import { onMount } from 'svelte';
    
    // Types
    interface TokenInfo {
        id: string;
        name: string;
        decimals: number;
        iconUrl?: string;
    }

    interface MonthlyStats {
        month: string;
        trades: number;
        volume: number;
        active_traders: number;
        avg_trade_size: number;
        largest_trade: number;
        monthLabel?: string;
    }

    // State management
    let stats: any = null;
    let isLoading = true;
    let error: string | null = null;
    let tokenInfoMap = new Map<string, TokenInfo>();
    let isRefreshing = false;

    // Sorting states
    let traderSort: 'volume' | 'trades' = 'volume';
    let tokenSort: 'volume' | 'traders' = 'volume';
    let tradeSort: 'time' | 'value' = 'time';

    // Helper Functions
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
        return item ? (num / item.value).toFixed(digits).replace(rx, "$1") + item.symbol : "0";
    }

    function formatAddress(address: string): string {
        if (!address) return '';
        return `${address.slice(0, 3)}...${address.slice(-3)}`;
    }

    function formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function formatMonthYear(dateStr: string): string {
        const date = new Date(dateStr);
        return date.toLocaleString('default', { month: 'short', year: 'numeric' });
    }

    async function fetchTokenInfo(tokenIds: string[]) {
        try {
            const response = await fetch('https://api.ergexplorer.com/tokens/byId', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: tokenIds })
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch token info');
            }

            const data = await response.json();
            const newTokenMap = new Map<string, TokenInfo>();
            
            data.items.forEach(token => {
                newTokenMap.set(token.id, {
                    id: token.id,
                    name: token.name || formatAddress(token.id),
                    decimals: parseInt(token.decimals || '0'),
                    iconUrl: token.iconurl // Note the lowercase 'u'
                });
            });
            
            tokenInfoMap = newTokenMap;
        } catch (err) {
            console.error('Error fetching token info:', err);
        }
    }

    function getTokenDisplay(tokenId: string): string {
        return tokenInfoMap.get(tokenId)?.name || formatAddress(tokenId);
    }

    // Trade Volume Calculation
    function calculateTradeVolume(trades: any[]): number {
        return trades.reduce((total, trade) => total + trade.trade_volume, 0);
    }

    // Sorting functions
    function sortTraders(by: 'volume' | 'trades') {
        traderSort = by;
        if (stats?.top_traders) {
            stats.top_traders = stats.top_traders.sort((a, b) => {
                if (by === 'volume') {
                    return b.total_volume - a.total_volume;
                }
                return b.trade_count - a.trade_count;
            });
        }
        stats = stats; // Trigger Svelte reactivity
    }

    function sortTokens(by: 'volume' | 'traders') {
        tokenSort = by;
        if (stats?.top_tokens) {
            stats.top_tokens = stats.top_tokens.sort((a, b) => {
                if (by === 'volume') {
                    return b.total_volume - a.total_volume;
                }
                return b.unique_traders - a.unique_traders;
            });
        }
        stats = stats; // Trigger Svelte reactivity
    }

    function sortTrades(by: 'time' | 'value') {
        tradeSort = by;
        if (stats?.top_trades) {
            stats.top_trades = stats.top_trades.sort((a, b) => {
                if (by === 'time') {
                    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
                }
                return b.trade_volume - a.trade_volume;
            });
        }
        stats = stats; // Trigger Svelte reactivity
    }

    // Prepare monthly stats with trade volume
    function prepareMonthlyStats(monthlyStats: MonthlyStats[]): MonthlyStats[] {
        return monthlyStats
            .map(stat => ({
                ...stat,
                monthLabel: formatMonthYear(stat.month)
            }))
            .sort((a, b) => new Date(b.month).getTime() - new Date(a.month).getTime());
    }

    async function fetchStats() {
        try {
            isRefreshing = true;
            const response = await fetch('https://stats.mewfinance.com/dex/campaigns/DexStats.php');
            
            if (!response.ok) {
                throw new Error('Failed to fetch stats');
            }

            stats = await response.json();

            // Collect unique token IDs
            const tokenIds = new Set<string>();
            if (stats.top_tokens) {
                stats.top_tokens.forEach(token => tokenIds.add(token.token_id));
            }
            if (stats.top_trades) {
                stats.top_trades.forEach(trade => tokenIds.add(trade.token_id));
            }

            // Fetch token info if needed
            if (tokenIds.size > 0) {
                await fetchTokenInfo([...tokenIds]);
            }

            // Apply current sorting
            if (traderSort) sortTraders(traderSort);
            if (tokenSort) sortTokens(tokenSort);
            if (tradeSort) sortTrades(tradeSort);

            // Prepare monthly stats
            if (stats.monthly_stats) {
                stats.monthly_stats = prepareMonthlyStats(stats.monthly_stats);
            }

        } catch (err) {
            console.error('Error fetching stats:', err);
            error = err.message;
        } finally {
            isRefreshing = false;
            isLoading = false;
        }
    }
    let isExpanded = false;
    
    function toggleExpansion() {
        isExpanded = !isExpanded;
    }
    let isCollapsed = false;
    onMount(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    });
</script>
<div class="dashboard-container">
    {#if isLoading && !stats}
        <div class="loading-container">
            <div class="loader"></div>
        </div>
    {:else if error}
        <div class="error-message">{error}</div>
    {:else}
        <!-- Stats Cards -->
        <div class="stats-row">
            <div class="stat-card">
                <div class="stat-title">Total Volume</div>
                <div class="stat-value">${nFormatter(stats.overall_stats.total_volume)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-title">Total Trades</div>
                <div class="stat-value">{nFormatter(stats.overall_stats.total_trades)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-title">Active Traders</div>
                <div class="stat-value">{stats.overall_stats.unique_traders}</div>
            </div>
            <div class="stat-card">
                <div class="stat-title">Avg Trade Size</div>
                <div class="stat-value">${nFormatter(stats.overall_stats.avg_trade_size)}</div>
            </div>
        </div>

        <div class="monthly-performance-section">
            <div class="panel">
                <div class="panel-header" on:click={() => isCollapsed = !isCollapsed}>
                    <h2>Current Month Performance</h2>
                    <button class="collapse-btn">
                        {#if isCollapsed}
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-chevron-down"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        {:else}
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-chevron-up"><polyline points="18 15 12 9 6 15"></polyline></svg>
                        {/if}
                    </button>
                </div>
                {#if !isCollapsed}
                <div class="panel-content">
                    {#if stats.monthly_stats && stats.monthly_stats.length > 0}
                        {@const currentMonth = stats.monthly_stats[0]}
                        <div class="stats-grid">
                            <div class="stat-card">
                                <div class="stat-title">Month</div>
                                <div class="stat-value">{currentMonth.monthLabel}</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-title">Trades</div>
                                <div class="stat-value">{nFormatter(currentMonth.trades)}</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-title">Volume</div>
                                <div class="stat-value text-info-color">${nFormatter(currentMonth.volume)}</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-title">Traders</div>
                                <div class="stat-value">{currentMonth.active_traders}</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-title">Avg Trade</div>
                                <div class="stat-value">${nFormatter(currentMonth.avg_trade_size)}</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-title">Largest Trade</div>
                                <div class="stat-value">${nFormatter(currentMonth.largest_trade)}</div>
                            </div>
                        </div>
                    {:else}
                        <div class="text-center text-text-light">No monthly data available</div>
                    {/if}
                </div>
                {/if}
            </div>
        </div>

        <!-- Main Content Grid -->
        <div class="content-grid">
            <!-- Top Traders -->
            <div class="data-panel">
                <div class="panel-header">
                    <h2>Top Traders</h2>
                    <div class="header-controls">
                        <button class="tab-btn {traderSort === 'volume' ? 'active' : ''}" 
                            on:click={() => sortTraders('volume')}>Volume</button>
                        <button class="tab-btn {traderSort === 'trades' ? 'active' : ''}" 
                            on:click={() => sortTraders('trades')}>Trades</button>
                    </div>
                </div>
                <div class="panel-content">
                    {#each stats.top_traders as trader, i}
                        <div class="trader-row">
                            <div class="rank">#{i + 1}</div>
                            <div class="trader-data">
                                <div class="address">{formatAddress(trader.address)}</div>
                                <div class="volume">${nFormatter(trader.total_volume)}</div>
                            </div>
                            <div class="trades">{trader.trade_count}</div>
                        </div>
                    {/each}
                </div>
            </div>

            <!-- Top Tokens -->
            <div class="data-panel">
                <div class="panel-header">
                    <h2>Top Tokens</h2>
                    <div class="header-controls">
                        <button class="tab-btn {tokenSort === 'volume' ? 'active' : ''}" 
                            on:click={() => sortTokens('volume')}>Volume</button>
                        <button class="tab-btn {tokenSort === 'traders' ? 'active' : ''}" 
                            on:click={() => sortTokens('traders')}>Traders</button>
                    </div>
                </div>
                <div class="panel-content">
                    {#each stats.top_tokens as token, i}
                        <div class="token-row">
                            <div class="rank">#{i + 1}</div>
                            <div class="token-info">
                                {#if tokenInfoMap.get(token.token_id)?.iconUrl}
                                    <img 
                                        src={tokenInfoMap.get(token.token_id).iconUrl} 
                                        alt="" 
                                        class="token-icon"
                                        on:error={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = `https://spectrum.fi/logos/ergo/${token.token_id}.svg`;
                                        }}
                                    />
                                {:else}
                                    <div class="token-placeholder">
                                        {getTokenDisplay(token.token_id).charAt(0)}
                                    </div>
                                {/if}
                                <div class="token-data">
                                    <span class="token-name">{getTokenDisplay(token.token_id)}</span>
                                    <span class="token-volume">${nFormatter(token.total_volume)}</span>
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>

            <!-- Recent Trades -->
            <div class="data-panel">
                <div class="panel-header">
                    <h2>Recent Trades</h2>
                    <div class="header-controls">
                        <button class="tab-btn {tradeSort === 'time' ? 'active' : ''}" 
                            on:click={() => sortTrades('time')}>Time</button>
                        <button class="tab-btn {tradeSort === 'value' ? 'active' : ''}" 
                            on:click={() => sortTrades('value')}>Value</button>
                    </div>
                </div>
                <div class="panel-content">
                    {#each stats.top_trades as trade}
                        <div class="trade-row {trade.trade_type}">
                            <div class="trade-amount">${nFormatter(trade.trade_volume)}</div>
                            <div class="trade-info">
                                
                                <div class="token-name">{getTokenDisplay(trade.token_id)}</div>
                                <div class="trade-details">
                                    <span class="trader">{formatAddress(trade.address)}</span>
                                    <span class="time">{formatDate(trade.timestamp)}</span>
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        </div>
    {/if}
</div>
<style>
    .dashboard-container {
        max-width: 1400px;
        margin: 0 auto;
        padding: 1rem;
    }

    .loading-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 450px;
    }

    .loader {
        width: 40px;
        height: 40px;
        border: 3px solid var(--borders);
        border-top-color: var(--main-color);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    .stats-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 0.75rem;
        margin-bottom: 1rem;
    }

    .stat-card {
        background: var(--forms-bg);
        padding: 1rem;
        border-radius: 0.5rem;
        border: 1px solid var(--borders);
    }

    .stat-title {
        color: var(--text-light);
        font-size: 0.875rem;
        margin-bottom: 0.5rem;
    }

    .stat-value {
        color: var(--main-color);
        font-size: 1.5rem;
        font-weight: 600;
    }

    .monthly-performance-section {
        margin-bottom: 1rem;
    }

    .panel {
        background: var(--forms-bg);
        border: 1px solid var(--footer);
        border-radius: 0.5rem;
    }

    .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem;
        border-bottom: 1px solid var(--footer);
        color: var(--secondary-color);
        cursor: pointer;
    }

    .collapse-btn {
        background: transparent;
        border: none;
        color: var(--secondary-color);
        cursor: pointer;
    }

    .panel-content {
        padding: 1rem;
    }

    .stats-grid {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 1rem;
    }

    .stat-card {
        background: var(--footer);
        padding: 1rem;
        border-radius: 0.5rem;
    }

    .stat-title {
        color: var(--text-light);
        font-size: 0.875rem;
        margin-bottom: 0.25rem;
    }

    .stat-value {
        font-size: 1.125rem;
        font-weight: 500;
    }
    .month-largest-trade {
        min-width: 100px;
        text-align: right;
    }

    .content-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
    }

    .data-panel {
        background: var(--forms-bg);
        border: 1px solid var(--borders);
        border-radius: 0.5rem;
        height: 450px;
        display: flex;
        flex-direction: column;
    }

    .panel-header {
        padding: 0.75rem;
        border-bottom: 1px solid var(--borders);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .panel-header h2 {
        font-size: 0.875rem;
        color: var(--secondary-color);
        margin: 0;
    }

    .header-controls {
        display: flex;
        gap: 0.5rem;
    }

    .tab-btn {
        background: transparent;
        border: 1px solid var(--borders);
        color: var(--text-light);
        padding: 0.25rem 0.75rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        cursor: pointer;
        transition: 0.2s;
    }

    .tab-btn:hover {
        border-color: var(--main-color);
        color: var(--main-color);
    }

    .tab-btn.active {
        background: var(--main-color);
        border-color: var(--main-color);
        color: var(--background);
    }

    .panel-content {
        padding: 0.5rem;
        overflow-y: auto;
        flex: 1;
    }

    /* Trader Rows */
    .trader-row {
        display: flex;
        align-items: center;
        padding: 0.5rem;
        margin-bottom: 0.25rem;
        background: var(--footer);
        border-radius: 0.25rem;
        transition: background 0.2s;
    }

    .trader-row:hover {
        background: var(--striped-2);
    }

    .rank {
        color: var(--main-color);
        font-size: 0.75rem;
        min-width: 2rem;
    }

    .trader-data {
        flex: 1;
        min-width: 0;
    }

    .address {
        color: var(--secondary-color);
        font-size: 0.875rem;
    }

    .volume {
        color: var(--info-color);
        font-size: 0.75rem;
    }

    .trades {
        color: var(--text-light);
        font-size: 0.75rem;
    }

    /* Token Rows */
    .token-row {
        display: flex;
        align-items: center;
        padding: 0.5rem;
        margin-bottom: 0.25rem;
        background: var(--footer);
        border-radius: 0.25rem;
        transition: background 0.2s;
    }

    .token-row:hover {
        background: var(--striped-2);
    }

    .token-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex: 1;
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

    .token-data {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-width: 0;
    }

    .token-name {
        color: var(--info-color);
        font-size: 0.875rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .token-volume {
        color: var(--main-color);
        font-size: 0.75rem;
    }

    /* Trade Rows */
    .trade-row {
        display: flex;
        align-items: center;
        padding: 0.5rem;
        margin-bottom: 0.25rem;
        background: var(--footer);
        border-radius: 0.25rem;
        border-left: 2px solid transparent;
        transition: background 0.2s;
    }

    .trade-row:hover {
        background: var(--striped-2);
    }

    .trade-row.buy {
        border-left-color: var(--main-color);
    }

    .trade-row.sell {
        border-left-color: #ff5252;
    }

    .trade-amount {
        font-size: 0.875rem;
        color: var(--info-color);
        font-weight: 500;
        min-width: 80px;
    }

    .trade-info {
        flex: 1;
        min-width: 0;
    }

    .trade-details {
        display: flex;
        justify-content: space-between;
        color: var(--text-light);
        font-size: 0.75rem;
    }

    .trader {
        color: var(--text-light);
    }

    .time {
        color: var(--text-light);
    }

    /* Custom Scrollbar */
    .panel-content::-webkit-scrollbar {
        width: 4px;
    }

    .panel-content::-webkit-scrollbar-track {
        background: transparent;
    }

    .panel-content::-webkit-scrollbar-thumb {
        background: var(--borders);
        border-radius: 2px;
    }

    /* Responsive Adjustments */
    @media (max-width: 1200px) {
        .content-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }

    @media (max-width: 768px) {
        .content-grid {
            grid-template-columns: 1fr;
        }
        .stats-row {
            grid-template-columns: repeat(2, 1fr);
        }
        .month-stats {
            grid-template-columns: repeat(2, 1fr);
        }
    }

    /* Animations */
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
</style>