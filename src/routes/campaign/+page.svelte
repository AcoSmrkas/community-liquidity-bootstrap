<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { API_HOST } from '$lib/common/const.js';
    import AssetInfo from '$lib/components/contribute/AssetInfo.svelte';
    import StatusBadge from '$lib/components/contribute/StatusBadge.svelte';
    import CampaignTypeTag from '$lib/components/contribute/CampaignTypeTag.svelte';
    
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
    let hoverData = null;
    
    const timeframes = [
        { id: '24h', label: '24H', ms: 24 * 60 * 60 * 1000 },
        { id: '7d', label: '7D', ms: 7 * 24 * 60 * 60 * 1000 },
        { id: '30d', label: '30D', ms: 30 * 24 * 60 * 60 * 1000 }
    ];

    function initializeChart() {
        if (!chartCanvas) return;
        
        ctx = chartCanvas.getContext('2d');
        
        // Set canvas size based on container
        const container = chartCanvas.parentElement;
        chartWidth = container?.clientWidth || 800;
        chartHeight = container?.clientHeight || 400;
        
        // Handle retina displays
        const scale = window.devicePixelRatio;
        chartCanvas.style.width = chartWidth + 'px';
        chartCanvas.style.height = chartHeight + 'px';
        chartCanvas.width = Math.floor(chartWidth * scale);
        chartCanvas.height = Math.floor(chartHeight * scale);
        
        if (ctx) {
            ctx.scale(scale, scale);
        }
    }

    function getTimeframedData() {
        if (!chartData.length) return [];
        const timeframe = timeframes.find(t => t.id === selectedTimeframe);
        const cutoffTime = Date.now() - (timeframe?.ms || 24 * 60 * 60 * 1000);
        return chartData.filter(d => d.timestamp >= cutoffTime);
    }

    function drawChart() {
        if (!ctx || !chartData.length) return;

        const data = getTimeframedData();
        if (!data.length) return;

        // Clear the canvas
        ctx.clearRect(0, 0, chartWidth, chartHeight);

        // Set background
        ctx.fillStyle = '#111827';
        ctx.fillRect(0, 0, chartWidth, chartHeight);

        // Calculate chart dimensions
        const padding = { top: 20, right: 60, bottom: 30, left: 80 };
        const plotWidth = chartWidth - padding.left - padding.right;
        const plotHeight = chartHeight - padding.top - padding.bottom;

        // Transform prices to ERG value (1/price)
        const ergValues = data.map(d => 1 / d.price);
        const minValue = Math.min(...ergValues) * 0.95;
        const maxValue = Math.max(...ergValues) * 1.05;

        const times = data.map(d => d.timestamp);
        const minTime = Math.min(...times);
        const maxTime = Math.max(...times);

        // Scaling functions
        const scaleX = (time: number) => 
            padding.left + ((time - minTime) / (maxTime - minTime)) * plotWidth;
        
        const scaleY = (value: number) => 
            padding.top + plotHeight - ((value - minValue) / (maxValue - minValue)) * plotHeight;

        // Draw grid
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;

        // Value grid lines
        const valueStep = (maxValue - minValue) / 5;
        for (let i = 0; i <= 5; i++) {
            const value = minValue + (i * valueStep);
            const y = scaleY(value);

            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(chartWidth - padding.right, y);
            ctx.stroke();

            // Value labels
            ctx.fillStyle = '#64748b';
            ctx.font = '12px system-ui';
            ctx.textAlign = 'right';
            ctx.fillText(value.toFixed(2) + ' ERG', padding.left - 10, y + 4);
        }

        // Time grid lines
        const timeStep = (maxTime - minTime) / 6;
        for (let i = 0; i <= 6; i++) {
            const time = minTime + (i * timeStep);
            const x = scaleX(time);

            ctx.beginPath();
            ctx.moveTo(x, padding.top);
            ctx.lineTo(x, chartHeight - padding.bottom);
            ctx.stroke();

            // Time labels
            ctx.fillStyle = '#64748b';
            ctx.textAlign = 'center';
            const date = new Date(time);
            const formattedTime = selectedTimeframe === '24h' 
                ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
            ctx.fillText(formattedTime, x, chartHeight - padding.bottom + 20);
        }

        // Draw line
        ctx.beginPath();
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;

        data.forEach((point, i) => {
            const x = scaleX(point.timestamp);
            const y = scaleY(1 / point.price);
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Draw points
        data.forEach(point => {
            const x = scaleX(point.timestamp);
            const y = scaleY(1 / point.price);

            ctx.beginPath();
            ctx.arc(x, y, 3, 0, 2 * Math.PI);
            ctx.fillStyle = '#60a5fa';
            ctx.fill();
        });

        // Draw hover data if available
        if (hoverData) {
            const { x, point } = hoverData;
            const y = scaleY(1 / point.price);

            // Vertical line
            ctx.beginPath();
            ctx.strokeStyle = '#ffffff33';
            ctx.setLineDash([5, 5]);
            ctx.moveTo(x, padding.top);
            ctx.lineTo(x, chartHeight - padding.bottom);
            ctx.stroke();
            ctx.setLineDash([]);

            // Hover tooltip
            const tooltipWidth = 120;
            const tooltipHeight = 50;
            const tooltipX = x > chartWidth / 2 ? x - tooltipWidth - 10 : x + 10;
            const tooltipY = y - tooltipHeight - 10;

            ctx.fillStyle = '#1f2937';
            ctx.strokeStyle = '#374151';
            ctx.beginPath();
            ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 4);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = '12px system-ui';
            ctx.textAlign = 'left';
            ctx.fillText((1 / point.price).toFixed(4) + ' ERG', tooltipX + 8, tooltipY + 20);
            ctx.fillStyle = '#9ca3af';
            ctx.fillText(
                new Date(point.timestamp).toLocaleString([], { 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit', 
                    minute: '2-digit'
                }), 
                tooltipX + 8, 
                tooltipY + 38
            );
        }
    }

    function handleChartHover(event: MouseEvent) {
        if (!chartCanvas || !chartData.length) return;

        const rect = chartCanvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const timeframedData = getTimeframedData();

        // Find closest point
        const padding = { left: 80, right: 60 };
        const plotWidth = chartWidth - padding.left - padding.right;
        const minTime = Math.min(...timeframedData.map(d => d.timestamp));
        const maxTime = Math.max(...timeframedData.map(d => d.timestamp));

        const hoveredTime = minTime + ((x - padding.left) / plotWidth) * (maxTime - minTime);
        
        if (x < padding.left || x > chartWidth - padding.right) {
            hoverData = null;
        } else {
            const point = timeframedData.reduce((prev, curr) => {
                return Math.abs(curr.timestamp - hoveredTime) < Math.abs(prev.timestamp - hoveredTime) ? curr : prev;
            });
            hoverData = { x, point };
        }
        
        drawChart();
    }

    function calculatePercentageChange(period: number): number {
        const data = getTimeframedData();
        if (!data.length) return 0;
        
        const lastPrice = 1 / data[data.length - 1].price;
        const periodAgo = data[0];
        
        if (!periodAgo) return 0;
        
        return ((lastPrice - (1 / periodAgo.price)) / (1 / periodAgo.price)) * 100;
    }

    async function fetchCampaign(id: string) {
        loading = true;
        try {
            const response = await fetch(`${API_HOST}/mew/fund/getCampaign?id=${id}`);
            const result = await response.json();

            if (result.items?.[0]) {
                campaign = result.items[0];
                await Promise.all([
                    fetchPoolData(campaign.lp_pool_id),
                    fetchTradeHistory(campaign.token_id),
                    fetchHolders(campaign.token_id)
                ]);
            }
        } catch (err) {
            console.error('Error fetching campaign:', err);
        } finally {
            loading = false;
        }
    }

    async function fetchPoolData(lpTokenId: string) {
        try {
            const response = await fetch(`https://api.spectrum.fi/v1/amm/pool/${lpTokenId}/chart`);
            const data = await response.json();

            if (data && Array.isArray(data) && data.length > 0) {
                chartData = data.sort((a, b) => a.timestamp - b.timestamp);
                if (ctx) drawChart();
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

    function formatAddress(address: string, length: number = 8): string {
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

    onMount(() => {
        initializeChart();
        
        const resizeObserver = new ResizeObserver(() => {
            if (chartCanvas) {
                initializeChart();
                drawChart();
            }
        });

        if (chartCanvas?.parentElement) {
            resizeObserver.observe(chartCanvas.parentElement);
        }

        // Handle mouse events for chart
        chartCanvas?.addEventListener('mousemove', handleChartHover);
        chartCanvas?.addEventListener('mouseleave', () => {
            hoverData = null;
            drawChart();
        });

        const currentId = $page.url.searchParams.get('id');
        if (currentId) {
            fetchCampaign(currentId);
        }

        return () => {
            resizeObserver.disconnect();
            chartCanvas?.removeEventListener('mousemove', handleChartHover);
            chartCanvas?.removeEventListener('mouseleave', () => {
                hoverData = null;
                drawChart();
            });
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
<div class="h-full flex flex-col grow main-page">
    <div class="container mx-auto p-4">
        {#if loading}
            <div class="flex justify-center items-center h-96">
                <div class="text-white">Loading...</div>
            </div>
        {:else if campaign}
            <!-- Main Card -->
            <div class="rounded-xl p-4 md:p-6 shadow-lg" style="background-color: var(--forms-bg);">
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
                        <div class="bg-gray-700/50 rounded-lg p-3 flex-1 min-w-[120px]">
                            <div class="text-sm text-gray-400">Price</div>
                            <div class="text-lg font-semibold text-white">{currentPrice.toFixed(2)} ERG</div>
                        </div>
                        <div class="bg-gray-700/50 rounded-lg p-3 flex-1 min-w-[120px]">
                            <div class="text-sm text-gray-400">24h</div>
                            <div class={`text-lg font-semibold ${calculatePercentageChange(chartData, 24 * 60 * 60 * 1000) >= 0 
                                ? 'text-green-400' 
                                : 'text-red-400'}`}>
                                {calculatePercentageChange(chartData, 24 * 60 * 60 * 1000).toFixed(2)}%
                            </div>
                        </div>
                        <div class="bg-gray-700/50 rounded-lg p-3 flex-1 min-w-[120px]">
                            <div class="text-sm text-gray-400">7d</div>
                            <div class={`text-lg font-semibold ${calculatePercentageChange(chartData, 7 * 24 * 60 * 60 * 1000) >= 0 
                                ? 'text-green-400' 
                                : 'text-red-400'}`}>
                                {calculatePercentageChange(chartData, 7 * 24 * 60 * 60 * 1000).toFixed(2)}%
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Chart Section -->
                <div class="mb-4">
                    <div class="flex justify-end gap-2 mb-3">
                        {#each timeframes as period}
                            <button 
                                class="px-3 py-1 rounded-lg text-sm transition-colors {
                                    selectedTimeframe === period.id 
                                        ? 'bg-blue-600 text-white' 
                                        : 'text-gray-400 hover:bg-gray-700'
                                }"
                                on:click={() => selectedTimeframe = period.id}
                            >
                                {period.label}
                            </button>
                        {/each}
                    </div>
                    <div class="relative w-full h-[300px] md:h-[400px] rounded-lg overflow-hidden" style="background-color: var(--footer);">
                        <canvas 
                            bind:this={chartCanvas}
                            class="w-full h-full"
                        ></canvas>
                    </div>
                </div>

                <!-- Trade History and Holders Grid -->
                <div class="grid grid-cols-1 lg:grid-cols-4 gap-4" >
                    <!-- Trade History (3 columns on large screens) -->
                    <div class="lg:col-span-3  rounded-lg p-4" style="background-color: var(--footer);">
                        <h3 class="text-lg font-bold text-white mb-3">Recent Trades</h3>
                        <div class="overflow-x-auto">
                            <table class="w-full min-w-[600px]">
                                <thead>
                                    <tr class="text-gray-400 text-sm">
                                        <th class="text-left py-2 px-2">Type</th>
                                        <th class="text-right py-2 px-2">Total ERG</th>
                                        <th class="text-right py-2 px-2">Total {campaign.token_name}</th>
                                        <th class="text-right py-2 px-2">Price (ERG)</th>
                                        <th class="text-right py-2 px-2">Age</th>
                                        <th class="text-right py-2 px-2">Maker</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {#each tradeHistory as trade}
                                        <tr class="border-t border-gray-800 text-sm hover:bg-gray-800/50">
                                            <td class="py-2 px-2">
                                                <span class={trade.order_type.includes('Buy') ? 'text-green-500' : 'text-red-500'}>
                                                    {trade.order_type}
                                                </span>
                                            </td>
                                            <td class="text-right text-white py-2 px-2">{trade.filled_base_amount}</td>
                                            <td class="text-right text-white py-2 px-2">{trade.filled_quote_amount}</td>
                                            <td class="text-right text-white py-2 px-2">
                                                Σ{(trade.filled_base_amount / trade.filled_quote_amount).toFixed(6)}
                                            </td>
                                            <td class="text-right text-gray-400 py-2 px-2">
                                                {formatTimeAgo(trade.chain_time)}
                                            </td>
                                            <td class="text-right py-2 px-2">
                                                <span class="text-blue-400">{formatAddress(trade.maker_address)}</span>
                                            </td>
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Holders (1 column) -->
                    {#if holders.length > 0}
                        <div class=" rounded-lg p-4" style="background-color: var(--footer);">
                            <h3 class="text-lg font-bold text-white mb-3">Top Holders</h3>
                            <div class="space-y-2">
                                {#each holders as holder}
                                    <div class="flex justify-between items-center py-1.5 px-2 hover:bg-gray-800/50 rounded-lg">
                                        <span class="text-gray-400 text-sm truncate max-w-[140px]">
                                            {formatAddress(holder.address)}
                                        </span>
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
        background-color: var(--forms-bg);
        color-scheme: dark;
    }
    
	.main-page {
		background-position: cover;
		background-repeat: no-repeat;
	}
    canvas {
        image-rendering: pixelated;
    }

    /* Improved table styles */
    table {
        border-collapse: separate;
        border-spacing: 0;
    }

    th {
        font-weight: 500;
        white-space: nowrap;
    }

    td {
        white-space: nowrap;
    }

    /* Fade horizontal scroll indicators */
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
.container {
        margin-top: 100px;
    }
    /* Better text truncation */
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