<script lang="ts">
    import { onMount } from 'svelte';
    
    export let data = [];
    
    let container;
    let canvas;
    let ctx;
    let width;
    let height;
    let selectedTimeframe = '24h';
    let hoverInfo = null;
    let mouseX = 0;
    let mouseY = 0;

    const timeframes = [
        { id: '24h', label: '24H', ms: 24 * 60 * 60 * 1000 },
        { id: '7d', label: '7D', ms: 7 * 24 * 60 * 60 * 1000 },
        { id: '30d', label: '30D', ms: 30 * 24 * 60 * 60 * 1000 }
    ];

    function handleChartHover(event) {
        const rect = canvas.getBoundingClientRect();
        mouseX = event.clientX - rect.left;
        mouseY = event.clientY - rect.top;

        const padding = calculatePadding();
        const plotWidth = width - padding.left - padding.right;
        
        // Check if mouse is within chart area
        if (mouseX < padding.left || mouseX > width - padding.right || 
            mouseY < padding.top || mouseY > height - padding.bottom) {
            hoverInfo = null;
            drawChart();
            return;
        }

        const filteredData = getTimeframedData();
        if (!filteredData.length) return;

        const dataIndex = Math.floor(((mouseX - padding.left) / plotWidth) * (filteredData.length - 1));
        if (dataIndex >= 0 && dataIndex < filteredData.length) {
            hoverInfo = {
                price: typeof filteredData[dataIndex].price === 'number' 
                    ? 1 / filteredData[dataIndex].price 
                    : filteredData[dataIndex].value,
                timestamp: filteredData[dataIndex].timestamp
            };
            drawChart();
        }
    }
    
    function getTimeframedData() {
        const timeframe = timeframes.find(t => t.id === selectedTimeframe);
        const cutoff = Date.now() - timeframe.ms;
        return data.filter(d => d.timestamp >= cutoff);
    }

    function calculatePadding() {
        return {
            top: 20,
            right: Math.max(60, width * 0.1),
            bottom: 60,  // Increased bottom padding for dates
            left: Math.max(80, width * 0.1)
        };
    }

    function updateDimensions() {
        if (!container) return;
        
        const rect = container.getBoundingClientRect();
        width = rect.width;
        height = Math.max(350, Math.min(rect.width * 0.5, 400));
        
        if (canvas) {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            
            if (ctx) {
                ctx.scale(dpr, dpr);
                drawChart();
            }
        }
    }

    function initChart() {
        if (!canvas) return;
        ctx = canvas.getContext('2d');
        updateDimensions();
    }
    
    function drawChart() {
        if (!ctx || !data.length) return;

        const filteredData = getTimeframedData();
        if (!filteredData.length) return;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#1E1B2C';
        ctx.fillRect(0, 0, width, height);
        
        const padding = calculatePadding();
        const plotWidth = width - padding.left - padding.right;
        const plotHeight = height - padding.top - padding.bottom;
        
        const processedData = filteredData.map(d => ({
            timestamp: d.timestamp || 0,
            value: typeof d.price === 'number' ? 1 / d.price : d.value || 0
        })).filter(d => !isNaN(d.value) && d.value !== Infinity);

        if (processedData.length === 0) return;
        
        const values = processedData.map(d => d.value);
        const minValue = Math.min(...values) * 0.995;
        const maxValue = Math.max(...values) * 1.005;
        const valueRange = maxValue - minValue || 1;
        
        // Draw grid
        const gridLines = 5;
        ctx.strokeStyle = '#2d374850';
        ctx.lineWidth = 1;
        
        // Draw grid lines and labels
        for (let i = 0; i <= gridLines; i++) {
            const y = padding.top + (i / gridLines) * plotHeight;
            const value = maxValue - (i / gridLines) * valueRange;
            
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();
            
            ctx.fillStyle = '#718096';
            ctx.font = '12px Inter';
            ctx.textAlign = 'right';
            ctx.fillText(value.toFixed(8), padding.left - 10, y + 4);
        }
        
        // Plot the line
        ctx.beginPath();
        ctx.strokeStyle = '#FFEB3B';  // Yellow line
        ctx.lineWidth = 2;
        
        processedData.forEach((point, i) => {
            const x = padding.left + (i / (processedData.length - 1)) * plotWidth;
            const y = padding.top + ((maxValue - point.value) / valueRange) * plotHeight;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // Fill area under the line
        ctx.lineTo(padding.left + plotWidth, height - padding.bottom);
        ctx.lineTo(padding.left, height - padding.bottom);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 235, 59, 0.1)';  // Semi-transparent yellow
        ctx.fill();

        // Draw time labels
        const timeLabels = 6;
        for (let i = 0; i <= timeLabels; i++) {
            const x = padding.left + (i / timeLabels) * plotWidth;
            const dataIndex = Math.floor((i / timeLabels) * (processedData.length - 1));
            const date = new Date(processedData[dataIndex].timestamp);
            
            ctx.fillStyle = '#718096';
            ctx.font = '12px Inter';
            ctx.textAlign = 'center';
            const timeStr = selectedTimeframe === '24h'
                ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
            // Draw date labels with more space and clearer positioning
            ctx.save();
            ctx.fillStyle = '#718096';
            ctx.font = '12px Inter';
            ctx.textAlign = 'center';
            ctx.translate(x, height - padding.bottom + 30);
            ctx.rotate(-0.2); // Slight angle for better readability
            ctx.fillText(timeStr, 0, 0);
            ctx.restore();
        }

        // Draw hover info
        if (hoverInfo) {
            // Draw vertical line
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(mouseX, padding.top);
            ctx.lineTo(mouseX, height - padding.bottom);
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw tooltip
            const tooltipWidth = 160;
            const tooltipHeight = 80;
            let tooltipX = mouseX + 10;
            let tooltipY = mouseY - tooltipHeight - 10;

            // Adjust tooltip position if it would go off screen
            if (tooltipX + tooltipWidth > width - padding.right) {
                tooltipX = mouseX - tooltipWidth - 10;
            }
            if (tooltipY < padding.top) {
                tooltipY = mouseY + 10;
            }

            // Draw tooltip background
            ctx.fillStyle = '#1f2937';
            ctx.strokeStyle = '#374151';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 4);
            ctx.fill();
            ctx.stroke();

            // Draw tooltip content
            ctx.fillStyle = '#9ca3af';
            ctx.font = '12px Inter';
            ctx.textAlign = 'left';
            
            const date = new Date(hoverInfo.timestamp);
            const timeStr = date.toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            ctx.fillText('Price:', tooltipX + 10, tooltipY + 25);
            ctx.fillText('Time:', tooltipX + 10, tooltipY + 50);
            
            ctx.fillStyle = '#ffffff';
            ctx.fillText(hoverInfo.price.toFixed(8) + ' ERG', tooltipX + 50, tooltipY + 25);
            ctx.fillText(timeStr, tooltipX + 50, tooltipY + 50);
        }
    }
    
    onMount(() => {
        initChart();
        
        const resizeObserver = new ResizeObserver(() => {
            requestAnimationFrame(() => {
                updateDimensions();
            });
        });
        
        if (container) {
            resizeObserver.observe(container);
        }
        
        return () => {
            resizeObserver.disconnect();
        };
    });
    
    $: if (data?.length && ctx) {
        drawChart();
    }

    $: if (selectedTimeframe && ctx) {
        drawChart();
    }
</script>

<div 
    bind:this={container} 
    class="chart-container bg-[#1E1B2C] rounded-lg p-4 border border-gray-800"
>
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div class="flex items-center gap-2">
            <span class="text-lg font-semibold text-white">Price Chart</span>
        </div>
        <div class="flex flex-wrap gap-2">
            {#each timeframes as period}
                <button 
                    class="px-3 py-1.5 rounded text-sm transition-colors {
                        selectedTimeframe === period.id 
                            ? 'bg-[#2563eb] text-white' 
                            : 'text-gray-400 hover:bg-[#2A2543] border border-gray-700'
                    }"
                    on:click={() => selectedTimeframe = period.id}
                >
                    {period.label}
                </button>
            {/each}
        </div>
    </div>
    <div class="relative w-full">
        <canvas
            bind:this={canvas}
            on:mousemove={handleChartHover}
            on:mouseleave={() => {
                hoverInfo = null;
                drawChart();
            }}
        ></canvas>
    </div>
</div>

<style>
    .chart-container {
        width: 100%;
        background: #1E1B2C;
        overflow: visible;  /* Allow content to overflow for dates */
    }
    
    canvas {
        display: block;
        width: 100%;
        height: 100%;
        image-rendering: pixelated;
    }

    button {
        transition: all 0.2s ease;
    }
</style>