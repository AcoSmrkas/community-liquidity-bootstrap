//src/routes/campaign/+page.svelte
<script lang="ts">
       import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { API_HOST } from '$lib/common/const.js';
    import AssetInfo from '$lib/components/contribute/AssetInfo.svelte';
    import StatusBadge from '$lib/components/contribute/StatusBadge.svelte';
    import CampaignTypeTag from '$lib/components/contribute/CampaignTypeTag.svelte';
    
    let campaign = null;
    let loading = true;

    let tradeHistory = [];
    let holders = [];
    let loadingHolders = false;
    let selectedTimeframe = '24h';



    const timeframes = [
        { id: '24h', label: '24h' },
        { id: '7d', label: '7d' },
        { id: '30d', label: '30d' }
    ];

    async function fetchHolders(tokenId: string) {
        try {
            loadingHolders = true;
            const response = await fetch(`https://api.ergo.watch/lists/addresses/by/balance?token_id=${tokenId}&limit=10&_=${Date.now()}`);
            const data = await response.json();
            console.log('Token holders data:', data);
            holders = data;
        } catch (err) {
            console.error('Error fetching holders:', err);
        } finally {
            loadingHolders = false;
        }
    }

  
    let chartCanvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D | null = null;
    let chartData: any[] = [];
    let chartWidth: number;
    let chartHeight: number;

    function initializeChart() {
        if (!chartCanvas) return;
        
        console.log('Initializing chart...');
        ctx = chartCanvas.getContext('2d');
        
        // Set canvas size
        chartWidth = chartCanvas.parentElement?.clientWidth || 800;
        chartHeight = 400;
        
        // Set display size
        chartCanvas.style.width = '100%';
        chartCanvas.style.height = `${chartHeight}px`;
        
        // Set actual size in memory (scaled for retina displays)
        const scale = window.devicePixelRatio;
        chartCanvas.width = Math.floor(chartWidth * scale);
        chartCanvas.height = Math.floor(chartHeight * scale);
        
        if (ctx) {
            // Scale context to match device pixel ratio
            ctx.scale(scale, scale);
            console.log('Chart context initialized:', { width: chartWidth, height: chartHeight, scale });
        } else {
            console.error('Failed to get 2D context');
        }
    }

    async function fetchPoolData(lpTokenId: string) {
        try {
            const url = `https://api.spectrum.fi/v1/amm/pool/${lpTokenId}/chart`;
            console.log('Fetching pool data from URL:', url);

            const response = await fetch(url);
            const data = await response.json();
            console.log('Pool price data:', data);

            if (data && Array.isArray(data) && data.length > 0) {
                chartData = data.sort((a, b) => a.timestamp - b.timestamp);
                console.log('Processed chart data:', chartData);
                
                // Initialize chart if not already done
                if (!ctx) {
                    initializeChart();
                }
                
                // Draw chart if context exists
                if (ctx) {
                    drawChart();
                } else {
                    console.error('Chart context not available');
                }
            }
        } catch (err) {
            console.error('Error fetching pool data:', err);
        }
    }
    async function fetchTradeHistory(tokenId: string) {
        try {
            const response = await fetch(`https://api.cruxfinance.io/dex/order_history?token_id=${tokenId}&offset=0&limit=40`);
            const data = await response.json();
            console.log('Trade history:', data);
            tradeHistory = data;
        } catch (err) {
            console.error('Error fetching trades:', err);
        }
    }

    // Update the campaign fetch function to use lp_tokenid
async function fetchCampaign(id: string) {
    loading = true;
    try {
        const response = await fetch(`${API_HOST}/mew/fund/getCampaign?id=${id}`);
        const result = await response.json();
        console.log('Campaign API response:', result);

        if (result.items?.[0]) {
            campaign = result.items[0];
            console.log('Campaign data:', campaign);
            console.log('Token details:', {
                token_id: campaign.token_id,
                token_name: campaign.token_name,
                lp_tokenid: campaign.lp_tokenid
            });

            if (campaign.token_id) {
                console.log('Fetching additional data');
                await Promise.all([
                    fetchTradeHistory(campaign.token_id),
                    // Use lp_tokenid for pool data
                    campaign.lp_tokenid ? fetchPoolData(campaign.lp_tokenid) : console.log('No LP token ID available'),
                    fetchHolders(campaign.token_id)
                ]);
            } else {
                console.warn('No token_id found in campaign data');
            }
        } else {
            console.warn('No campaign found in response');
        }
    } catch (err) {
        console.error('Error fetching campaign:', err);
        console.error('Error details:', {
            message: err.message,
            stack: err.stack
        });
    } finally {
        loading = false;
    }
}
function drawChart() {
        if (!ctx || !chartData.length) {
            console.error('Cannot draw chart:', { ctx: !!ctx, dataLength: chartData.length });
            return;
        }

        console.log('Drawing chart with data points:', chartData.length);

        // Clear the canvas
        ctx.clearRect(0, 0, chartWidth, chartHeight);

        // Set background
        ctx.fillStyle = '#131722';
        ctx.fillRect(0, 0, chartWidth, chartHeight);

        // Calculate chart dimensions
        const padding = { top: 20, right: 60, bottom: 30, left: 80 };
        const plotWidth = chartWidth - padding.left - padding.right;
        const plotHeight = chartHeight - padding.top - padding.bottom;

        // Find min/max values
        const prices = chartData.map(d => d.price);
        const minPrice = Math.min(...prices) * 0.95;
        const maxPrice = Math.max(...prices) * 1.05;

        // Get time range
        const times = chartData.map(d => d.timestamp);
        const minTime = Math.min(...times);
        const maxTime = Math.max(...times);

        // Create scaling functions
        const scaleX = (time: number) => 
            padding.left + ((time - minTime) / (maxTime - minTime)) * plotWidth;
        
        const scaleY = (price: number) => 
            padding.top + plotHeight - ((price - minPrice) / (maxPrice - minPrice)) * plotHeight;

        // Draw grid and axes
        ctx.strokeStyle = '#2d2d3d';
        ctx.lineWidth = 1;

        // Draw price grid lines
        const priceStep = (maxPrice - minPrice) / 5;
        for (let i = 0; i <= 5; i++) {
            const price = minPrice + (i * priceStep);
            const y = scaleY(price);

            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(chartWidth - padding.right, y);
            ctx.stroke();

            // Price labels
            ctx.fillStyle = '#666';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(Math.round(price).toLocaleString(), padding.left - 10, y + 4);
        }

        // Draw time grid lines
        const timeStep = (maxTime - minTime) / 6;
        for (let i = 0; i <= 6; i++) {
            const time = minTime + (i * timeStep);
            const x = scaleX(time);

            ctx.beginPath();
            ctx.moveTo(x, padding.top);
            ctx.lineTo(x, chartHeight - padding.bottom);
            ctx.stroke();

            // Time labels
            ctx.fillStyle = '#666';
            ctx.textAlign = 'center';
            const date = new Date(time);
            ctx.fillText(
                date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                x,
                chartHeight - padding.bottom + 20
            );
        }

        // Draw price line
        ctx.beginPath();
        ctx.strokeStyle = '#ffc107';
        ctx.lineWidth = 2;

        chartData.forEach((point, i) => {
            const x = scaleX(point.timestamp);
            const y = scaleY(point.price);
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Draw data points
        chartData.forEach(point => {
            const x = scaleX(point.timestamp);
            const y = scaleY(point.price);

            ctx.beginPath();
            ctx.arc(x, y, 3, 0, 2 * Math.PI);
            ctx.fillStyle = '#ffc107';
            ctx.fill();
        });
    }

    onMount(() => {
        console.log('Component mounted');
        initializeChart();
        
        // Handle resize
        const resizeObserver = new ResizeObserver(() => {
            if (chartCanvas) {
                console.log('Resize detected, reinitializing chart');
                initializeChart();
                if (chartData.length > 0) {
                    drawChart();
                }
            }
        });

        if (chartCanvas) {
            resizeObserver.observe(chartCanvas.parentElement as Element);
        }

        return () => {
            resizeObserver.disconnect();
        };
    });
// Add helper for percentage change calculation
function calculatePercentageChange(data: any[], period: number): number {
    if (!data.length) return 0;
    
    const lastPrice = data[data.length - 1].price;
    const periodAgo = data.find(d => d.timestamp >= (Date.now() - period));
    
    if (!periodAgo) return 0;
    
    return ((lastPrice - periodAgo.price) / periodAgo.price) * 100;
}
    function formatTimeAgo(timestamp) {
        const minutes = Math.floor((Date.now() - timestamp) / 60000);
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h`;
        return `${Math.floor(hours / 24)}d`;
    }

    function formatAddress(address: string, length: number = 8) {
        if (!address) return '';
        return `${address.slice(0, length)}...${address.slice(-length)}`;
    }
    onMount(() => {
        if (chartCanvas) {
            console.log('Initializing chart canvas');
            ctx = chartCanvas.getContext('2d');
            chartCanvas.width = chartCanvas.offsetWidth * 2;
            chartCanvas.height = 300 * 2;
            chartCanvas.style.width = '100%';
            chartCanvas.style.height = '300px';
        }

        // Get initial campaign data if ID exists
        const currentId = $page.url.searchParams.get('id');
        if (currentId) {
            console.log('Initial campaign ID:', currentId);
            fetchCampaign(currentId);
        }

        const resizeObserver = new ResizeObserver(() => {
            if (chartCanvas) {
                console.log('Resizing chart canvas');
                chartCanvas.width = chartCanvas.offsetWidth * 2;
                chartCanvas.height = 300 * 2;
                drawChart();
            }
        });

        if (chartCanvas) {
            resizeObserver.observe(chartCanvas);
        }

        return () => {
            resizeObserver.disconnect();
        };
    });
    function formatNumber(num: number, decimals: number = 2): string {
    if (num === 0 || num === null || num === undefined) return '0';

    const suffixes = ['', 'K', 'M', 'B', 'T']; // Add more if needed
    const tier = Math.floor(Math.log10(Math.abs(num)) / 3); // Determine the tier (thousands, millions, etc.)
    const scaledNum = num / Math.pow(10, tier * 3); // Scale the number to the appropriate tier

    // Ensure tier doesn't exceed suffixes
    const suffix = suffixes[tier] || '';
    
    // Format the scaled number with the appropriate number of decimals
    return `${new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(scaledNum)}${suffix}`;
}
    // Watch for URL changes
    $: {
        const id = $page.url.searchParams.get('id');
        if (id) {
            console.log('URL changed, new campaign ID:', id);
            fetchCampaign(id);
        }
    }

    $: currentPrice = chartData.length > 0 ? chartData[chartData.length - 1].price : 0;
</script>
<div class="container mx-auto px-4 py-8">
    <div class="text-center mb-12">
<div class="min-h-screen bg-[#1E1429]">
    <div class="container mx-auto p-4">
        {#if loading}
            <div class="flex justify-center items-center h-96">
                <div class="text-white">Loading...</div>
            </div>
        {:else if campaign}
            <!-- Price Stats -->
           <!-- Price Stats -->
<div class="mb-4 bg-[#2A1F3D] rounded-lg p-4">
    <div class="flex items-center gap-8">
        <div>
            <div class="text-gray-400 text-sm">Price (Tokens per ERG)</div>
            <div class="text-white text-xl">
                {chartData.length ? formatNumber(chartData[chartData.length - 1].price, 2) : '0.00'}
            </div>
        </div>
        <div>
            <div class="text-gray-400 text-sm">24h:</div>
            <div class={calculatePercentageChange(chartData, 24 * 60 * 60 * 1000) >= 0 ? 'text-green-400' : 'text-red-400'}>
                {formatNumber(calculatePercentageChange(chartData, 24 * 60 * 60 * 1000), 2)}%
            </div>
        </div>
        <div>
            <div class="text-gray-400 text-sm">7d:</div>
            <div class={calculatePercentageChange(chartData, 7 * 24 * 60 * 60 * 1000) >= 0 ? 'text-green-400' : 'text-red-400'}>
                {formatNumber(calculatePercentageChange(chartData, 7 * 24 * 60 * 60 * 1000), 2)}%
            </div>
        </div>
    </div>
</div>

            <!-- Main Grid -->
            <div class="grid grid-cols-7 gap-4">
                <!-- Chart Section -->
                <div class="col-span-5 space-y-4">
                    <!-- Price Chart -->
                    <div class="bg-[#2A1F3D] rounded-lg p-4">
                        <div class="flex justify-between items-center mb-4">
                            <h2 class="text-xl text-white">Price chart USD</h2>
                            <div class="flex gap-2">
                                {#each timeframes as period}
                                    <button 
                                        class="px-4 py-1 rounded-lg text-sm transition-colors {
                                            selectedTimeframe === period.id 
                                                ? 'bg-[#ffc107] text-black' 
                                                : 'text-gray-400 hover:bg-[#3D2C57]'
                                        }"
                                        on:click={() => selectedTimeframe = period.id}
                                    >
                                        {period.label}
                                    </button>
                                {/each}
                            </div>
                        </div>

                        <div class="relative w-full h-[400px]">
                            <canvas 
                                bind:this={chartCanvas}
                                class="w-full h-full"
                            ></canvas>
                        </div>
                    </div>

                    <!-- Trade History -->
                    <div class="bg-[#2A1F3D] rounded-lg p-4">
                        <h3 class="text-lg font-bold text-white mb-4">Recent Trades</h3>
                        <div class="overflow-x-auto">
                            <table class="w-full">
                                <thead>
                                    <tr class="text-gray-400">
                                        <th class="text-left py-2">Type</th>
                                        <th class="text-right py-2">Total ERG</th>
                                        <th class="text-right py-2">Total {campaign.token_name}</th>
                                        <th class="text-right py-2">Price (ERG)</th>
                                        <th class="text-right py-2">Age</th>
                                        <th class="text-right py-2">Maker</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {#each tradeHistory as trade}
                                        <tr class="border-t border-gray-800">
                                            <td class="py-2">
                                                <span class={trade.order_type.includes('Buy') ? 'text-green-500' : 'text-red-500'}>
                                                    {trade.order_type}
                                                </span>
                                            </td>
                                            <td class="text-right text-white">{trade.filled_base_amount}</td>
                                            <td class="text-right text-white">{trade.filled_quote_amount}</td>
                                            <td class="text-right text-white">
                                                Σ{(trade.filled_base_amount / trade.filled_quote_amount).toFixed(6)}
                                            </td>
                                            <td class="text-right text-gray-400">
                                                {formatTimeAgo(trade.chain_time)}
                                            </td>
                                            <td class="text-right">
                                                <span class="text-[#2196f3]">{formatAddress(trade.maker_address)}</span>
                                            </td>
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Side Column -->
                <div class="col-span-2 space-y-4">
                    <!-- Campaign Info -->
                    <div class="bg-[#2A1F3D] rounded-lg p-4">
                        <div class="flex flex-col h-full">
                            <div class="mb-4">
                                <div class="flex items-center gap-2 mb-2">
                                    <CampaignTypeTag type={campaign.campaign_type} />
                                    <StatusBadge status={campaign.status_phase} />
                                </div>
                                <h3 class="text-lg font-bold text-white mb-2">{campaign.title}</h3>
                                <p class="text-gray-400 text-sm">{campaign.description}</p>
                            </div>

                            <AssetInfo
                                asset={{
                                    name: campaign.base_name,
                                    iconUrl: campaign.base_icon_url,
                                    tokenId: campaign.base_token_id,
                                    currentAmount: campaign.base_raised || 0,
                                    targetAmount: campaign.base_target_amount
                                }}
                                secondaryAsset={campaign.token_target_amount ? {
                                    name: campaign.token_name,
                                    iconUrl: campaign.token_icon_url,
                                    tokenId: campaign.token_id,
                                    currentAmount: campaign.token_raised || 0,
                                    targetAmount: campaign.token_target_amount
                                } : null}
                                compact={true}
                            />
                        </div>
                    </div>

                    <!-- Top Holders -->
                    {#if holders.length > 0}
                        <div class="bg-[#2A1F3D] rounded-lg p-4">
                            <h3 class="text-lg font-bold text-white mb-4">Top Holders</h3>
                            <div class="space-y-2">
                                {#each holders as holder}
                                    <div class="flex justify-betweenitems-center py-2">
                                        <div class="flex items-center gap-2">
                                            <span class="text-gray-400 text-sm">
                                                {formatAddress(holder.address)}
                                            </span>
                                        </div>
                                        <div class="text-white text-sm">
                                            {formatNumber(holder.balance)} {campaign.token_name}
                                        </div>
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
</div></div>
<style>
    :global(body) {
        background-color: #1E1429;
    }

    canvas {
        image-rendering: pixelated;
    }

    th {
        font-weight: 500;
        font-size: 0.875rem;
    }

    tr:hover {
        background-color: rgba(255, 255, 255, 0.05);
    }

    button {
        transition: all 0.2s;
    }

    /* Ensure proper text truncation */
    .truncate {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
</style>