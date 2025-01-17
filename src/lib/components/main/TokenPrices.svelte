<script lang="ts">
    import { onMount } from 'svelte';

    interface TokenInfo {
        id: string;
        name: string;
        decimals: number;
        iconUrl?: string;
    }

    interface MarketData {
        baseSymbol: string;
        quoteSymbol: string;
        quoteId: string;
        lastPrice: string;
        baseVolume: string;
        quoteVolume: string;
    }

    let isLoading = true;
    let error: string | null = null;
    let tokenData = [];
    const periods = ['H', 'D', 'W', 'M'];
    let favorites = new Set();

    function toggleFavorite(tokenId: string) {
        if (favorites.has(tokenId)) {
            favorites.delete(tokenId);
        } else {
            favorites.add(tokenId);
        }
        favorites = favorites; // Trigger reactivity
    }

    function formatNumber(num: number, prefix = ''): string {
        if (num === undefined || num === null) return 'N/A';
        if (num === 0) return '0';
        
        const absNum = Math.abs(num);
        if (absNum >= 1e9) return prefix + (num / 1e9).toFixed(2) + 'B';
        if (absNum >= 1e6) return prefix + (num / 1e6).toFixed(2) + 'M';
        if (absNum >= 1e3) return prefix + (num / 1e3).toFixed(2) + 'K';
        return prefix + num.toFixed(2);
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
        return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
    }

    function getPercentageClass(value: number): string {
        if (!value) return '';
        return value >= 0 ? 'positive' : 'negative';
    }

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

            // Create a map for market data
            const marketDataMap = new Map<string, {
                price: number;
                usdPrice: number;
                liquidity: number;
            }>();

            marketData.forEach(market => {
                if (market.baseSymbol === 'ERG') {
                    const lastPrice = Number(market.lastPrice);
                    const ergPrice = 1 / lastPrice;
                    const usdPrice = ergPrice * ergUsdPrice;
                    const baseVolume = Number(market.baseVolume);
                    const quoteVolume = Number(market.quoteVolume);
                    const liquidity = (baseVolume + (quoteVolume * lastPrice)) * ergUsdPrice;
                    
                    marketDataMap.set(market.quoteId, {
                        price: ergPrice,
                        usdPrice,
                        liquidity
                    });
                }
            });

            // Fetch token info from ErgExplorer
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
            const holderCountsPromises = tokenIds.map(async (tokenId) => {
                try {
                    const response = await fetch(`https://api.ergo.watch/lists/addresses/by/balance?token_id=${tokenId}&limit=1`);
                    if (!response.ok) return { tokenId, count: 0 };
                    const data = await response.json();
                    return { tokenId, count: data.total };
                } catch (err) {
                    console.error(`Error fetching holder count for ${tokenId}:`, err);
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
                const changes = priceChangesByToken[id] || {};
                
                return {
                    info: tokenInfo,
                    stats: {
                        ...stats,
                        price: market?.usdPrice || 0,
                        liquidity: market?.liquidity || 0,
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

        } catch (err) {
            console.error('Error fetching data:', err);
            error = err.message;
        } finally {
            isLoading = false;
        }
    }

    onMount(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    });
</script>

<div class="container-dash">
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
                {#each tokenData as token}
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
                            <div class="secondary">H {formatNumber(token.stats.holders)}</div>
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

<style>
    .dashboard-container {
        max-width: 1400px;
        margin: 0 auto;
        padding: 1rem;
    }
    table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0 4px;
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
</style>