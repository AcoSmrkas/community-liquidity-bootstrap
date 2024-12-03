<script lang="ts">
 import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { API_HOST } from '$lib/common/const.js';
    import AssetInfo from '$lib/components/contribute/AssetInfo.svelte';
    import StatusBadge from '$lib/components/contribute/StatusBadge.svelte';
    import CampaignTypeTag from '$lib/components/contribute/CampaignTypeTag.svelte';
    import SimpleChart from './SimpleChart.svelte';
    
    let campaign = null;
    let loading = true;
    let chartCanvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D | null = null;
    let chartData: any[] = [];
    let chartWidth: number;
    let chartHeight: number;
    let selectedTimeframe = '24h';
    let tradeHistory = [];
    let holders = [];
    let hoverInfo = null;
    let mouseX = 0;
    let mouseY = 0;

    interface CandleData {
        timestamp: number;
        open: number;
        high: number;
        low: number;
        close: number;
    }
    
    const timeframes = [
        { id: '24h', label: '24H', ms: 24 * 60 * 60 * 1000 },
        { id: '7d', label: '7D', ms: 7 * 24 * 60 * 60 * 1000 },
        { id: '30d', label: '30D', ms: 30 * 24 * 60 * 60 * 1000 }
    ];

    function processDataToCandles(data: any[]): CandleData[] {
        // Group data points into 30-minute intervals
        const interval = 30 * 60 * 1000; // 30 minutes in milliseconds
        const groupedData = {};
        
        data.forEach(point => {
            const timeGroup = Math.floor(point.timestamp / interval) * interval;
            if (!groupedData[timeGroup]) {
                groupedData[timeGroup] = {
                    prices: [],
                    timestamp: timeGroup
                };
            }
            // Convert price to ERG value (1/price)
            groupedData[timeGroup].prices.push(1 / point.price);
        });

        // Convert grouped data to candles
        return Object.values(groupedData).map(group => {
            const prices = group.prices;
            return {
                timestamp: group.timestamp,
                open: prices[0],
                high: Math.max(...prices),
                low: Math.min(...prices),
                close: prices[prices.length - 1]
            };
        }).sort((a, b) => a.timestamp - b.timestamp);
    }

    function initChart() {
        if (!chartCanvas) return;
        
        ctx = chartCanvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const rect = chartCanvas.parentElement?.getBoundingClientRect();
        chartWidth = rect?.width || 800;
        chartHeight = rect?.height || 400;

        chartCanvas.width = chartWidth * dpr;
        chartCanvas.height = chartHeight * dpr;
        chartCanvas.style.width = `${chartWidth}px`;
        chartCanvas.style.height = `${chartHeight}px`;
        
        if (ctx) {
            ctx.scale(dpr, dpr);
            if (chartData.length > 0) {
                drawChart();
            }
        }
    }

    function getTimeframedData() {
        const timeframe = timeframes.find(t => t.id === selectedTimeframe);
        const cutoff = Date.now() - timeframe.ms;
        return chartData.filter(d => d.timestamp >= cutoff);
    }

    function drawChart() {
        if (!ctx || !chartData.length) return;

        const data = getTimeframedData();
        if (!data.length) return;

        const candles = processDataToCandles(data);

        // Clear canvas
        ctx.clearRect(0, 0, chartWidth, chartHeight);
        ctx.fillStyle = 'var(--footer)';
        ctx.fillRect(0, 0, chartWidth, chartHeight);

        const padding = { top: 20, right: 60, bottom: 30, left: 80 };
        const plotWidth = chartWidth - padding.left - padding.right;
        const plotHeight = chartHeight - padding.top - padding.bottom;

        // Calculate price range
        const allPrices = candles.reduce((prices, candle) => 
            [...prices, candle.high, candle.low], []);
        const minPrice = Math.min(...allPrices) * 0.995;
        const maxPrice = Math.max(...allPrices) * 1.005;
        const priceRange = maxPrice - minPrice;

        // Calculate time range
        const times = candles.map(c => c.timestamp);
        const minTime = Math.min(...times);
        const maxTime = Math.max(...times);
        const timeRange = maxTime - minTime;

        // Draw grid
        const gridLines = 6;
        ctx.strokeStyle = '#2d374850';
        ctx.lineWidth = 1;

        // Horizontal grid
        for (let i = 0; i <= gridLines; i++) {
            const y = padding.top + (i / gridLines) * plotHeight;
            const price = maxPrice - (i / gridLines) * priceRange;

            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(chartWidth - padding.right, y);
            ctx.stroke();

            ctx.fillStyle = '#718096';
            ctx.font = '12px Inter';
            ctx.textAlign = 'right';
            ctx.fillText(price.toFixed(4) + ' ERG', padding.left - 10, y + 4);
        }

        // Vertical grid
        for (let i = 0; i <= gridLines; i++) {
            const x = padding.left + (i / gridLines) * plotWidth;
            const time = new Date(minTime + (i / gridLines) * timeRange);

            ctx.beginPath();
            ctx.moveTo(x, padding.top);
            ctx.lineTo(x, chartHeight - padding.bottom);
            ctx.stroke();

            ctx.fillStyle = '#718096';
            ctx.font = '12px Inter';
            ctx.textAlign = 'center';
            const timeStr = selectedTimeframe === '24h' 
                ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : time.toLocaleDateString([], { month: 'short', day: 'numeric' });
            ctx.fillText(timeStr, x, chartHeight - padding.bottom + 20);
        }

        // Draw candles
        const candleWidth = (plotWidth / candles.length) * 0.8;
        candles.forEach((candle, i) => {
            const x = padding.left + (i + 0.1) * (plotWidth / candles.length);
            
            const openY = padding.top + ((maxPrice - candle.open) / priceRange) * plotHeight;
            const closeY = padding.top + ((maxPrice - candle.close) / priceRange) * plotHeight;
            const highY = padding.top + ((maxPrice - candle.high) / priceRange) * plotHeight;
            const lowY = padding.top + ((maxPrice - candle.low) / priceRange) * plotHeight;

            // Draw candlestick body
            ctx.fillStyle = candle.open > candle.close ? '#ef4444' : '#22c55e';
            ctx.strokeStyle = candle.open > candle.close ? '#ef4444' : '#22c55e';
            
            const bodyHeight = Math.max(Math.abs(closeY - openY), 1);
            ctx.fillRect(x, Math.min(openY, closeY), candleWidth, bodyHeight);

            // Draw wicks
            ctx.beginPath();
            ctx.moveTo(x + candleWidth / 2, highY);
            ctx.lineTo(x + candleWidth / 2, Math.min(openY, closeY));
            ctx.moveTo(x + candleWidth / 2, Math.max(openY, closeY));
            ctx.lineTo(x + candleWidth / 2, lowY);
            ctx.stroke();
        });

        // Draw hover indicators
        if (hoverInfo) {
            const candle = hoverInfo;
            const candleIndex = candles.indexOf(candle);
            const x = padding.left + (candleIndex + 0.5) * (plotWidth / candles.length);

            // Crosshair
            ctx.strokeStyle = '#ffffff33';
            ctx.setLineDash([5, 5]);
            
            // Vertical line
            ctx.beginPath();
            ctx.moveTo(x, padding.top);
            ctx.lineTo(x, chartHeight - padding.bottom);
            ctx.stroke();

            // Horizontal line at close price
            const closeY = padding.top + ((maxPrice - candle.close) / priceRange) * plotHeight;
            ctx.beginPath();
            ctx.moveTo(padding.left, closeY);
            ctx.lineTo(chartWidth - padding.right, closeY);
            ctx.stroke();
            
            ctx.setLineDash([]);

            // Draw tooltip
            const tooltipWidth = 200;
            const tooltipHeight = 100;
            let tooltipX = mouseX + 10;
            let tooltipY = mouseY - tooltipHeight - 10;

            if (tooltipX + tooltipWidth > chartWidth - padding.right) {
                tooltipX = mouseX - tooltipWidth - 10;
            }
            if (tooltipY < padding.top) {
                tooltipY = mouseY + 10;
            }

            // Tooltip background
            ctx.fillStyle = '#1f2937';
            ctx.strokeStyle = '#374151';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 4);
            ctx.fill();
            ctx.stroke();

            // Tooltip content
            ctx.fillStyle = '#9ca3af';
            ctx.font = '12px Inter';
            ctx.textAlign = 'left';
            
            const labels = ['Open:', 'High:', 'Low:', 'Close:', 'Time:'];
            const values = [
                candle.open.toFixed(6) + ' ERG',
                candle.high.toFixed(6) + ' ERG',
                candle.low.toFixed(6) + ' ERG',
                candle.close.toFixed(6) + ' ERG',
                new Date(candle.timestamp).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })
            ];

            labels.forEach((label, i) => {
                ctx.fillStyle = '#9ca3af';
                ctx.fillText(label, tooltipX + 10, tooltipY + 20 + i * 18);
                ctx.fillStyle = '#ffffff';
                ctx.fillText(values[i], tooltipX + 60, tooltipY + 20 + i * 18);
            });
        }
    }

    function handleChartHover(event: MouseEvent) {
        const rect = chartCanvas.getBoundingClientRect();
        mouseX = event.clientX - rect.left;
        mouseY = event.clientY - rect.top;

        const padding = { top: 20, right: 60, bottom: 30, left: 80 };
        if (mouseX < padding.left || mouseX > chartWidth - padding.right || 
            mouseY < padding.top || mouseY > chartHeight - padding.bottom) {
            hoverInfo = null;
            drawChart();
            return;
        }

        const plotWidth = chartWidth - padding.left - padding.right;
        const candles = processDataToCandles(getTimeframedData());
        const candleIndex = Math.floor((mouseX - padding.left) / (plotWidth / candles.length));
        
        if (candleIndex >= 0 && candleIndex < candles.length) {
            hoverInfo = candles[candleIndex];
            drawChart();
        }
    }

    async function fetchCampaign(id: string) {
        loading = true;
        try {
            const response = await fetch(`${API_HOST}/mew/fund/getCampaign?id=${id}`);
            const result = await response.json();

            if (result.items?.[0]) {
                campaign = result.items[0];
                if (campaign.lp_pool_id) {
                    await Promise.all([
                        fetchPoolData(campaign.lp_pool_id),
                        fetchTradeHistory(campaign.token_id),
                        fetchHolders(campaign.token_id)
                    ]);
                }
            }
        } catch (err) {
            console.error('Error fetching campaign:', err);
        } finally {
            loading = false;
        }
    }

    async function fetchPoolData(poolId: string) {
        try {
            const response = await fetch(`https://api.spectrum.fi/v1/amm/pool/${poolId}/chart`);
            const data = await response.json();

            if (data && Array.isArray(data) && data.length > 0) {
                chartData = data.sort((a, b) => a.timestamp - b.timestamp);
                drawChart();
            }
        } catch (err) {
            console.error('Error fetching pool data:', err);
        }
    }

    async function fetchTradeHistory(tokenId: string) {
        try {
            const response = await fetch(`https://api.cruxfinance.io/dex/order_history?token_id=${tokenId}&offset=0&limit=40`);
            const data = await response.json();
            tradeHistory = data;
        } catch (err) {
            console.error('Error fetching trade history:', err);
        }
    }

    async function fetchHolders(tokenId: string) {
        try {
            const response = await fetch(`https://api.ergo.watch/lists/addresses/by/balance?token_id=${tokenId}&limit=10&_=${Date.now()}`);
            const data = await response.json();
            holders = data;
        } catch (err) {
            console.error('Error fetching holders:', err);
        }
    }

    function formatTimeAgo(timestamp: number): string {
        const minutes = Math.floor((Date.now() - timestamp) / 60000);
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h`;
        return `${Math.floor(hours / 24)}d`;
    }

    function formatAddress(address: string, length: number = 4): string {
        if (!address) return '';
        return `${address.slice(0, length)}...${address.slice(-length)}`;
    }

    function formatNumber(num: number, decimals: number = 2): string {
        if (num === null || num === undefined) return '0';
        if (num === 0) return '0';

        const absNum = Math.abs(num);
        if (absNum < 1000) {
            return num.toFixed(decimals);
        }

        const suffixes = ['', 'K', 'M', 'B', 'T'];
        const tier = Math.floor(Math.log10(absNum) / 3);
        const scaled = num / Math.pow(10, tier * 3);
        const suffix = suffixes[tier];
        
        return scaled.toFixed(decimals) + suffix;
    }
    function calculatePercentageChange(data: any[], period: number): number {
        if (!data || data.length < 2) return 0;
        
        const currentPrice = 1 / data[data.length - 1].price;
        const cutoffTime = Date.now() - period;
        
        // Find the closest data point to the cutoff time
        const pastData = [...data]
            .reverse()
            .find(d => d.timestamp <= cutoffTime);
            
        if (!pastData) return 0;
        
        const pastPrice = 1 / pastData.price;
        
        return ((currentPrice - pastPrice) / pastPrice) * 100;
    }

    onMount(() => {
        // Initialize chart
        initChart();
        
        // Set up resize observer
        const resizeObserver = new ResizeObserver(() => {
            // Debounce resize handling
            const timeoutId = setTimeout(() => {
                initChart();
            }, 100);
            return () => clearTimeout(timeoutId);
        });

        // Set up chart event listeners
        if (chartCanvas) {
            // Observer for canvas container
            if (chartCanvas.parentElement) {
                resizeObserver.observe(chartCanvas.parentElement);
            }

            // Mouse event listeners for chart interactions
            chartCanvas.addEventListener('mousemove', handleChartHover);
            chartCanvas.addEventListener('mouseleave', () => {
                hoverInfo = null;
                drawChart();
            });
            chartCanvas.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const touch = e.touches[0];
                handleChartHover(new MouseEvent('mousemove', {
                    clientX: touch.clientX,
                    clientY: touch.clientY
                }));
            });
            chartCanvas.addEventListener('touchend', () => {
                hoverInfo = null;
                drawChart();
            });

            // Set up canvas context
            const ctx = chartCanvas.getContext('2d');
            if (ctx) {
                // Enable antialiasing
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
            }
        }

        // Fetch initial data if campaign ID exists
        const currentId = $page.url.searchParams.get('id');
        if (currentId) {
            fetchCampaign(currentId).then(() => {
                // Initial draw after data fetch
                if (chartData.length > 0) {
                    drawChart();
                }
            });
        }

        // Watch for theme changes
        const themeObserver = new MutationObserver(() => {
            if (chartData.length > 0) {
                drawChart();
            }
        });

        // Observe theme changes on document body
        themeObserver.observe(document.body, {
            attributes: true,
            attributeFilter: ['class']
        });

        // Watch for window focus/blur to handle updates
        window.addEventListener('focus', () => {
            if (campaign?.lp_pool_id) {
                fetchPoolData(campaign.lp_pool_id);
            }
        });

        // Cleanup function
        return () => {
            // Disconnect observers
            resizeObserver.disconnect();
            themeObserver.disconnect();

            // Remove event listeners
            if (chartCanvas) {
                chartCanvas.removeEventListener('mousemove', handleChartHover);
                chartCanvas.removeEventListener('mouseleave', () => {
                    hoverInfo = null;
                    drawChart();
                });
                chartCanvas.removeEventListener('touchstart', (e) => {
                    e.preventDefault();
                    const touch = e.touches[0];
                    handleChartHover(new MouseEvent('mousemove', {
                        clientX: touch.clientX,
                        clientY: touch.clientY
                    }));
                });
                chartCanvas.removeEventListener('touchend', () => {
                    hoverInfo = null;
                    drawChart();
                });
            }

            // Remove window event listeners
            window.removeEventListener('focus', () => {
                if (campaign?.lp_pool_id) {
                    fetchPoolData(campaign.lp_pool_id);
                }
            });

            // Clear any pending timers
            clearTimeout(resizeTimeoutId);
        };
    });
    // Watch for URL changes
    $: {
        const id = $page.url.searchParams.get('id');
        if (id) fetchCampaign(id);
    }

    // Watch for timeframe changes
    $: {
        if (selectedTimeframe && chartData.length) {
            drawChart();
        }
    }

    $: currentPrice = chartData.length > 0 ? 1 / chartData[chartData.length - 1].price : 0;
</script>
<div class="min-h-screen" style="background: var(--footer); margin-top: 100px;">
    <div class="container mx-auto p-4">
        {#if loading}
            <div class="flex justify-center items-center h-96" style="background: var(--forms-bg)">
                <div class="text-white">Loading...</div>
            </div>
        {:else if campaign}
            <div class="rounded-xl p-4 md:p-6 shadow-lg" style="background: var(--forms-bg)">
                <!-- Header Section -->
                <div class="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                    <div>
                        <div class="flex items-center gap-2 mb-2">
                            <CampaignTypeTag type={campaign.campaign_type} />
                            <StatusBadge status={campaign.status_phase} />
                        </div>
                        <h1 class="text-xl md:text-2xl font-bold text-white mb-1">{campaign.title}</h1>
                        <p class="text-sm text-gray-400">{campaign.description}</p>
                    </div>
                    
                    <!-- Price Stats -->
                    <div class="flex flex-wrap gap-3">
                        <div class="bg-[#1E1B2C] rounded-lg p-3 flex-1 min-w-[120px] border border-gray-800">
                            <div class="text-sm text-gray-400">Price</div>
                            <div class="text-lg font-semibold text-white">
                                {chartData.length ? (1 / chartData[chartData.length - 1].price).toFixed(6) : '0.00'} ERG
                            </div>
                        </div>
                        {#each timeframes as period}
                            <div class="bg-[#1E1B2C] rounded-lg p-3 flex-1 min-w-[120px] border border-gray-800">
                                <div class="text-sm text-gray-400">{period.label} Change</div>
                                {#if chartData.length}
                                    {@const change = calculatePercentageChange(chartData, period.ms)}
                                    <div class={`text-lg font-semibold ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                                    </div>
                                {/if}
                            </div>
                        {/each}
                    </div>
                </div>

                <!-- Chart Section -->
                <div class="mb-8">
                 
                     
                        <div class="relative w-full h-[550px] bg-[#1E1B2C] rounded-lg overflow-hidden">
                            <SimpleChart data={chartData} />
                        </div>
                    
                </div>

                <!-- Trade History and Holders Grid -->
                <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    <!-- Trade History -->
                    <div class="lg:col-span-3 bg-[#1E1B2C] rounded-lg p-4 border border-gray-800">
                        <h3 class="text-lg font-semibold text-white mb-4">Recent Trades</h3>
                        <div class="overflow-x-auto custom-scrollbar max-h-[500px]">
                            <table class="w-full min-w-[600px]">
                                <thead class="sticky top-0 bg-[#1E1B2C] z-10">
                                    <tr class="text-gray-400 text-sm">
                                        <th class="text-left py-2 px-3">Type</th>
                                        <th class="text-right py-2 px-3">Total ERG</th>
                                        <th class="text-right py-2 px-3">Total {campaign.token_name}</th>
                                        <th class="text-right py-2 px-3">Price (ERG)</th>
                                        <th class="text-right py-2 px-3">Age</th>
                                        <th class="text-right py-2 px-3">Maker</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {#each tradeHistory as trade}
                                        <tr class="border-t border-gray-800 text-sm hover:bg-[#2A2543] transition-colors">
                                            <td class="py-2 px-3">
                                                <span class={trade.order_type.includes('Buy') ? 'text-green-500' : 'text-red-500'}>
                                                    {trade.order_type}
                                                </span>
                                            </td>
                                            <td class="text-right text-white py-2 px-3">{trade.filled_base_amount}</td>
                                            <td class="text-right text-white py-2 px-3">{trade.filled_quote_amount}</td>
                                            <td class="text-right text-white py-2 px-3">
                                                Σ{(trade.filled_base_amount / trade.filled_quote_amount).toFixed(6)}
                                            </td>
                                            <td class="text-right text-gray-400 py-2 px-3">
                                                {formatTimeAgo(trade.chain_time)}
                                            </td>
                                            <td class="text-right py-2 px-3">
                                                <span class="text-blue-400 hover:text-blue-300 cursor-pointer">
                                                    {formatAddress(trade.maker_address)}
                                                </span>
                                            </td>
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Holders -->
                    {#if holders.length > 0}
                        <div class="bg-[#1E1B2C] rounded-lg p-4 border border-gray-800">
                            <h3 class="text-lg font-semibold text-white mb-4">Top Holders</h3>
                            <div class="space-y-2">
                                {#each holders as holder, i}
                                    <div class="flex justify-between items-center py-2 px-3 hover:bg-[#2A2543] rounded-lg transition-colors">
                                        <div class="flex items-center gap-2">
                                            <span class="text-gray-500 text-sm">{i + 1}</span>
                                            <span class="text-gray-300 text-sm font-medium truncate max-w-[140px]">
                                                {formatAddress(holder.address)}
                                            </span>
                                        </div>
                                        <span class="text-white text-sm">
                                            {formatNumber(holder.balance)}
                                        </span>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/if}
                </div>
            </div>
        {/if}
    </div>
</div>

<style>
    :global(body) {
        background: var(--footer);
        color-scheme: dark;
    }

    canvas {
        image-rendering: pixelated;
    }

    /* Table styles */
    table {
        border-collapse: separate;
        border-spacing: 0;
    }

    th {
        font-weight: 500;
        white-space: nowrap;
    }
    .custom-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
    }

    .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
        height: 6px;
    }

    .custom-scrollbar::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.1);
        border-radius: 3px;
    }

    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 3px;
    }

    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.3);
    }

    /* For Firefox */
    @supports (scrollbar-color: auto) {
        .custom-scrollbar {
            scrollbar-color: rgba(255, 255, 255, 0.2) rgba(0, 0, 0, 0.1);
            scrollbar-width: thin;
        }
    }
    td {
        white-space: nowrap;
    }

    /* Scrollbar styles */
    .overflow-x-auto {
        position: relative;
        -webkit-mask-image: linear-gradient(to right, black 90%, transparent 100%);
        mask-image: linear-gradient(to right, black 90%, transparent 100%);
    }

    .overflow-x-auto::-webkit-scrollbar {
        height: 6px;
    }

    .overflow-x-auto::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.1);
        border-radius: 3px;
    }

    .overflow-x-auto::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 3px;
    }

    .overflow-x-auto::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.3);
    }

    /* Transitions */
    button {
        transition: all 0.2s ease;
    }

    tr {
        transition: background-color 0.15s ease;
    }

    .truncate {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    /* Responsive font sizes */
    @media (max-width: 640px) {
        .text-2xl {
            font-size: 1.5rem;
        }
        .text-lg {
            font-size: 1rem;
        }
        .text-sm {
            font-size: 0.8125rem;
        }
    }
</style>