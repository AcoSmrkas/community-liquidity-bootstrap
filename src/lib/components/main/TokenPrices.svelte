<script lang="ts">
    import { onMount } from 'svelte';

    interface TokenInfo {
        id: string;
        name: string;
        decimals: number;
        iconUrl?: string;
    }

    interface TokenStats {
        token_id: string;
        trade_count: number;
        buy_count: number;
        sell_count: number;
        total_volume: number;
        buy_volume: number;
        sell_volume: number;
        unique_traders: number;
        price?: number;
        liquidity?: number;
        holders?: number;
    }

    interface MarketData {
        baseSymbol: string;
        quoteSymbol: string;
        quoteId: string;
        lastPrice: string;
        baseVolume: string;
        quoteVolume: string;
    }

    interface PoolStats {
        id: string;
        lockedX: {
            id: string;
            amount: number;
            ticker: string;
            decimals: number;
        };
        lockedY: {
            id: string;
            amount: number;
            ticker: string;
            decimals: number;
        };
        tvl: {
            value: number;
            units: {
                currency: {
                    id: string;
                    decimals: number;
                };
            };
        };
    }

    interface TokenData {
        info: TokenInfo;
        stats: TokenStats;
        priceChanges: {
            [key: string]: number;
        };
    }

    // State Management
    let isLoading = true;
    let error: string | null = null;
    let tokenData: TokenData[] = [];
    let filteredData: TokenData[] = [];
    const periods = ['H', 'D', 'W', 'M'];
    let favorites = new Set<string>();

    // Sorting and filtering states
    let sortField: 'name' | 'price' | 'volume' | 'liquidity' | 'trades' | 'holders' | 'change' = 'volume';
    let sortDirection: 'ASC' | 'DESC' = 'DESC';
    let searchQuery = '';
    let selectedTimeframe: 'H' | 'D' | 'W' | 'M' = 'D';

    // Formatting Functions
    function formatNumber(num: number, prefix = ''): string {
        if (num === undefined || num === null) return 'N/A';
        if (num === 0) return '0';
        
        const absNum = Math.abs(num);
        if (absNum >= 1e9) return prefix + (num / 1e9).toFixed(2) + 'B';
        if (absNum >= 1e6) return prefix + (num / 1e6).toFixed(2) + 'M';
        if (absNum >= 1e3) return prefix + (num / 1e3).toFixed(2) + 'K';
        return prefix + num.toFixed(2);
    }

    function formatHolderCount(num: number): string {
        if (num === undefined || num === null) return '0';
        
        const absNum = Math.abs(num);
        if (absNum >= 1e9) return Math.floor(num / 1e9) + 'B';
        if (absNum >= 1e6) return Math.floor(num / 1e6) + 'M';
        if (absNum >= 1e3) return Math.floor(num / 1e3) + 'K';
        return Math.floor(num).toString();
    }

    function formatPrice(price: number): string {
        if (!price) return '$0.00';
        return price < 0.001 
            ? '$' + price.toFixed(8)
            : '$' + price.toFixed(4);
    }

    function formatAddress(address: string): string {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-6)}`;
    }

    function formatPercentage(value: number): string {
        if (value === undefined || value === null) return '0.00%';
        const formatted = Math.abs(value) < 0.01 ? '0.00' : value.toFixed(2);
        return `${value > 0 ? '+' : ''}${formatted}%`;
    }

    function getPercentageClass(value: number): string {
        if (!value) return '';
        return value >= 0 ? 'positive' : 'negative';
    }

    // Event Handlers
    function toggleFavorite(tokenId: string) {
        if (favorites.has(tokenId)) {
            favorites.delete(tokenId);
        } else {
            favorites.add(tokenId);
        }
        favorites = favorites;
        applyFilters();
    }

    function setSortField(field: typeof sortField) {
        if (sortField === field) {
            sortDirection = sortDirection === 'ASC' ? 'DESC' : 'ASC';
        } else {
            sortField = field;
            sortDirection = 'DESC';
        }
        applyFilters();
    }

    function setTimeframe(timeframe: typeof selectedTimeframe) {
        selectedTimeframe = timeframe;
        sortField = 'change';
        sortDirection = 'DESC';
        applyFilters();
    }

    // Filtering and Sorting
    function applyFilters() {
        let filtered = [...tokenData];

        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(token => 
                token.info.name.toLowerCase().includes(query) ||
                token.info.id.toLowerCase().includes(query)
            );
        }

        // Sort data
        filtered.sort((a, b) => {
            let comparison = 0;
            switch (sortField) {
                case 'name':
                    comparison = a.info.name.localeCompare(b.info.name);
                    break;
                case 'price':
                    comparison = (a.stats.price || 0) - (b.stats.price || 0);
                    break;
                case 'volume':
                    comparison = (a.stats.total_volume || 0) - (b.stats.total_volume || 0);
                    break;
                case 'liquidity':
                    comparison = (a.stats.liquidity || 0) - (b.stats.liquidity || 0);
                    break;
                case 'trades':
                    comparison = (a.stats.trade_count || 0) - (b.stats.trade_count || 0);
                    break;
                case 'holders':
                    comparison = (a.stats.holders || 0) - (b.stats.holders || 0);
                    break;
                case 'change':
                    const aChange = Number(a.priceChanges[selectedTimeframe]) || 0;
                    const bChange = Number(b.priceChanges[selectedTimeframe]) || 0;
                    comparison = aChange - bChange;
                    break;
            }
            return sortDirection === 'ASC' ? comparison : -comparison;
        });

        // Sort favorites to top
        if (favorites.size > 0) {
            filtered.sort((a, b) => {
                const aFav = favorites.has(a.info.id) ? 1 : 0;
                const bFav = favorites.has(b.info.id) ? 1 : 0;
                return bFav - aFav;
            });
        }

        filteredData = filtered;
    }

    // Data Fetching
    async function fetchData() {
        try {
            isLoading = true;
            
            // Fetch DEX stats
            const statsResponse = await fetch('https://stats.mewfinance.com/dex/campaigns/DexStats.php');
            if (!statsResponse.ok) throw new Error('Failed to fetch DEX stats');
            const statsData = await statsResponse.json();
            
            // Get token IDs
            const tokenIds = statsData.top_tokens.map(t => t.token_id);

            // Fetch Spectrum market data
            const spectrumResponse = await fetch('https://api.spectrum.fi/v1/price-tracking/markets');
            if (!spectrumResponse.ok) throw new Error('Failed to fetch market data');
            const marketData: MarketData[] = await spectrumResponse.json();

            // Fetch ERG USD price
            const ergPriceResponse = await fetch('https://api.ergexplorer.com/tokens/getErgPrice');
            if (!ergPriceResponse.ok) throw new Error('Failed to fetch ERG price');
            const ergPriceData = await ergPriceResponse.json();
            const ergUsdPrice = Number(ergPriceData.items[0].value);

            // Fetch Spectrum pool stats with current timestamp
            const currentTimestamp = Date.now();
            const poolStatsResponse = await fetch(`https://api.spectrum.fi/v1/amm/pools/stats?from=${currentTimestamp}`);
            if (!poolStatsResponse.ok) throw new Error('Failed to fetch pool stats');
            const poolStats: PoolStats[] = await poolStatsResponse.json();

            // Process market data
            const marketDataMap = new Map<string, {
                price: number;
                usdPrice: number;
            }>();

            marketData.forEach(market => {
                if (market.baseSymbol === 'ERG') {
                    const lastPrice = Number(market.lastPrice);
                    const ergPrice = 1 / lastPrice;
                    const usdPrice = ergPrice * ergUsdPrice;
                    
                    marketDataMap.set(market.quoteId, {
                        price: ergPrice,
                        usdPrice
                    });
                }
            });

            // Process pool stats for liquidity
            const liquidityMap = new Map<string, number>();
            poolStats.forEach(pool => {
                if (pool.lockedX.id === '0000000000000000000000000000000000000000000000000000000000000000') {
                    const tokenId = pool.lockedY.id;
                    const tvlUSD = pool.tvl.value;
                    
                    if (!liquidityMap.has(tokenId) || liquidityMap.get(tokenId) < tvlUSD) {
                        liquidityMap.set(tokenId, tvlUSD);
                    }
                }
                else if (pool.lockedY.id === '0000000000000000000000000000000000000000000000000000000000000000') {
                    const tokenId = pool.lockedX.id;
                    const tvlUSD = pool.tvl.value;
                    
                    if (!liquidityMap.has(tokenId) || liquidityMap.get(tokenId) < tvlUSD) {
                        liquidityMap.set(tokenId, tvlUSD);
                    }
                }
            });

            // Fetch token info
            const tokenInfoMap = new Map<string, TokenInfo>();
            const tokenInfoResponse = await fetch('https://api.ergexplorer.com/tokens/byId', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: tokenIds })
            });
            
            if (!tokenInfoResponse.ok) throw new Error('Failed to fetch token info');
            const tokenInfoData = await tokenInfoResponse.json();

            tokenInfoData.items.forEach(token => {
                tokenInfoMap.set(token.id, {
                    id: token.id,
                    name: token.name || formatAddress(token.id),
                    decimals: parseInt(token.decimals || '0'),
                    iconUrl: token.iconurl
                });
            });

            // Fetch price changes
            const priceResponse = await fetch('https://api.ergexplorer.com/tokens/getPriceChange', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ids: tokenIds,
                    periods: [1, 1, 7, 30] // 1h, 1d, 7d, 30d in days
                })
            });

            if (!priceResponse.ok) throw new Error('Failed to fetch price changes');
            const priceData = await priceResponse.json();

            // Process price changes
            const priceChangesByToken = {};
            priceData.results.forEach(result => {
                if (!priceChangesByToken[result.id]) {
                    priceChangesByToken[result.id] = {};
                }
                
                let period;
                switch(result.period_days) {
                    case 1: 
                        if (!priceChangesByToken[result.id]['H']) {
                            period = 'H';
                        } else {
                            period = 'D';
                        }
                        break;
                    case 7: period = 'W'; break;
                    case 30: period = 'M'; break;
                    default: return;
                }
                
                priceChangesByToken[result.id][period] = result.price_change_percentage;
            });

            // Fetch holder counts
            console.log('Fetching holder counts for tokens:', tokenIds);
            const holderCountsPromises = tokenIds.map(async (tokenId) => {
                try {
                    const response = await fetch(`https://api.ergo.watch/lists/addresses/by/balance?token_id=${tokenId}&limit=10000`);
                    
                    if (!response.ok) {
                        console.warn(`Failed to fetch holders for ${tokenId}`);
                        return { tokenId, count: 0 };
                    }
                    
                    const holders = await response.json();
                    const holderCount = holders.length;
                    console.log(`Token ${tokenId} has ${holderCount} holders`);
                    return { tokenId, count: holderCount };
                } catch (err) {
                    console.error(`Error fetching holders for ${tokenId}:`, err);
                    return { tokenId, count: 0 };
                }
            });

            const holderCounts = await Promise.all(holderCountsPromises);
            const holderCountMap = new Map(holderCounts.map(({ tokenId, count }) => [tokenId, count]));

            // Combine all data
            tokenData = tokenIds.map(id => {
                const tokenInfo = tokenInfoMap.get(id) || {
                    id,
                    name: formatAddress(id),
                    decimals: 0
                };
                
                const stats = statsData.top_tokens.find(t => t.token_id === id);
                const market = marketDataMap.get(id);
                const holders = holderCountMap.get(id) || 0;
                const liquidity = liquidityMap.get(id) || 0;
                const changes = priceChangesByToken[id] || {};
                
                return {
                    info: tokenInfo,
                    stats: {
                        ...stats,
                        price: market?.usdPrice || 0,
                        liquidity,
                        holders
                    },
                    priceChanges: {
                        'H': changes['H'] || 0,
                        'D': changes['D'] || 0,
                        'W': changes['W'] || 0,
                        'M': changes['M'] || 0
                    }
                };
            });

            applyFilters();
        } catch (err) {
            console.error('Error fetching data:', err);
            error = err.message;
        } finally {
            isLoading = false;
        }
    }

    // Reactive statement for filtering
    $: {
        if (tokenData.length > 0) {
            applyFilters();
        }
    }


    // Initialize data fetching
    onMount(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    });
</script>

<div class="token-prices-wrapper">
    <div class="filters-container">
        <div class="filter-group">
            <button 
                class="filter-btn {sortField === 'volume' ? 'active' : ''}"
                on:click={() => setSortField('volume')}
            >
                Volume {sortField === 'volume' ? (sortDirection === 'DESC' ? '↓' : '↑') : ''}
            </button>
            <button 
                class="filter-btn {sortField === 'liquidity' ? 'active' : ''}"
                on:click={() => setSortField('liquidity')}
            >
                Liquidity {sortField === 'liquidity' ? (sortDirection === 'DESC' ? '↓' : '↑') : ''}
            </button>
        </div>

        <div class="timeframe-group">
            {#each periods as period}
                <button 
                    class="filter-btn {selectedTimeframe === period ? 'active' : ''}"
                    on:click={() => setTimeframe(period)}
                >
                    {period} {sortField === 'change' && selectedTimeframe === period ? (sortDirection === 'DESC' ? '↓' : '↑') : ''}
                </button>
            {/each}
        </div>

        <div class="search-container">
            <input 
                type="text" 
                placeholder="Search tokens..."
                bind:value={searchQuery}
                on:input={applyFilters}
            />
        </div>
    </div>

    <div class="token-prices-container">
        {#if isLoading && tokenData.length === 0}
            <div class="loading-container">
                <div class="loader" />
            </div>
        {:else if error}
            <div class="error-message">{error}</div>
        {:else}
            <table>
                <thead>
                    <tr>
                        <th class="text-left">Token</th>
                        <th class="text-right">Price</th>
                        <th class="text-right">H</th>
                        <th class="text-right">D</th>
                        <th class="text-right">W</th>
                        <th class="text-right">M</th>
                        <th class="text-right">Volume<br/>Liquidity</th>
                        <th class="text-right">Transactions<br/>Holders</th>
                        <th class="text-right">Buys<br/>Sells</th>
                    </tr>
                </thead>
                <tbody>
                    {#each filteredData as token}
                        <tr>
                            <td class="token-cell">
                                <button 
                                    class="star-btn" 
                                    on:click={() => toggleFavorite(token.info.id)}
                                >
                                    {#if favorites.has(token.info.id)}
                                        ★
                                    {:else}
                                        ☆
                                    {/if}
                                </button>
                                {#if token.info.iconUrl}
                                    <img 
                                        src={token.info.iconUrl} 
                                        alt="" 
                                        class="token-icon"
                                        on:error={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = `https://spectrum.fi/logos/ergo/${token.info.id}.svg`;
                                        }}
                                    />
                                {:else}
                                    <div class="token-placeholder">
                                        {token.info.name.charAt(0)}
                                    </div>
                                {/if}
                                <span class="token-name">{token.info.name}</span>
                            </td>
                            <td class="text-right">{formatPrice(token.stats.price)}</td>
                            {#each periods as period}
                                <td class="text-right {getPercentageClass(token.priceChanges[period])}">
                                    {formatPercentage(token.priceChanges[period])}
                                </td>
                            {/each}
                            <td class="text-right volume-cell">
                                <div>V {formatNumber(token.stats.total_volume, "$")}</div>
                                <div class="secondary">L {formatNumber(token.stats.liquidity, "$")}</div>
                            </td>
                            <td class="text-right trades-cell">
                                <div>T {token.stats.trade_count}</div>
                                <div class="secondary">H {formatHolderCount(token.stats.holders)}</div>
                            </td>
                            <td class="text-right buysell-cell">
                                <div class="positive">B {token.stats.buy_count}</div>
                                <div class="negative">S {token.stats.sell_count}</div>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        {/if}
    </div>
</div>
<style>
    .token-prices-wrapper {
        background: var(--forms-bg);
        border-radius: 0.5rem;
        padding: 1rem;
    }

    .filters-container {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
        align-items: center;
        flex-wrap: wrap;
    }

    .filter-group,
    .timeframe-group {
        display: flex;
        gap: 0.5rem;
    }

    .filter-btn {
        background: var(--forms-bg);
        border: 1px solid var(--borders);
        color: var(--text-light);
        padding: 0.5rem 1rem;
        border-radius: 0.25rem;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 0.875rem;
    }

    .filter-btn:hover {
        border-color: var(--main-color);
        color: var(--main-color);
    }

    .filter-btn.active {
        background: var(--main-color);
        border-color: var(--main-color);
        color: var(--background);
    }

    .search-container {
        flex: 1;
        max-width: 300px;
    }

    .search-container input {
        width: 100%;
        padding: 0.5rem;
        border-radius: 0.25rem;
        border: 1px solid var(--borders);
        background: var(--forms-bg);
        color: var(--text);
        font-size: 0.875rem;
    }

    .search-container input:focus {
        outline: none;
        border-color: var(--main-color);
    }

    .token-prices-container {
        width: 100%;
        overflow-x: auto;
        max-height: 600px;
        position: relative;
    }

    table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0 4px;
    }

    thead {
        position: sticky;
        top: 0;
        background: var(--background);
        z-index: 1;
    }

    th {
        padding: 0.75rem;
        color: var(--text-light);
        font-size: 0.75rem;
        font-weight: 500;
        white-space: nowrap;
    }

    .text-right {
        text-align: right;
    }

    .text-left {
        text-align: left;
    }

    tr {
        background: var(--footer);
    }

    tbody tr {
        transition: background 0.2s;
    }

    tbody tr:hover {
        background: var(--striped-2);
    }

    td {
        padding: 0.75rem;
        font-size: 0.875rem;
    }

    .token-cell {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        min-width: 150px;
    }

    .star-btn {
        background: none;
        border: none;
        color: var(--main-color);
        cursor: pointer;
        padding: 0;
        font-size: 1.25rem;
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
        color: var(--info-color);
    }

    .volume-cell,
    .trades-cell,
    .buysell-cell {
        min-width: 100px;
    }

    .secondary {
        color: var(--text-light);
        font-size: 0.75rem;
    }

    .positive {
        color: #4caf50;
    }

    .negative {
        color: #ff5252;
    }

    .loading-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 200px;
    }

    .loader {
        width: 40px;
        height: 40px;
        border: 3px solid var(--borders);
        border-top-color: var(--main-color);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    .error-message {
        color: #ff5252;
        text-align: center;
        padding: 1rem;
    }

    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
        .filters-container {
            flex-direction: column;
            align-items: stretch;
        }

        .search-container {
            max-width: 100%;
        }
    }
</style>