<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { API_HOST } from '$lib/common/const.js';

    let contributions = [];
    let loading = true;
    let interval: number;

    interface Contribution {
        address: string;
        asset: string;
        amount: string;
        network: string;
        txid: string;
        timestamp: string;
    }

    const fetchLatestContributions = async () => {
        try {
            const response = await fetch('https://api.mewfinance.com/clb/getLatestContributions?limit=10');
            const data = await response.json();
            // Sort contributions by timestamp, latest first
            contributions = data.sort((a: Contribution, b: Contribution) => 
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
            loading = false;
        } catch (error) {
            console.error("Error fetching latest contributions:", error);
        }
    };

    const truncateAddress = (address: string) => {
        if (address.length <= 12) return address;
        return `${address.slice(0, 6)}...${address.slice(-6)}`;
    };

    const getExplorerUrl = (txid: string, network: string) => {
        return network === 'ergo' 
            ? `https://ergexplorer.com/transactions/${txid}`
            : `https://cexplorer.io/tx/${txid}`;
    };

    const formatDate = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleString();
    };

    onMount(() => {
        fetchLatestContributions();
        interval = setInterval(fetchLatestContributions, 10000); // Fetch every 10 seconds
    });

    onDestroy(() => {
        if (interval) clearInterval(interval);
    });
</script>

<style>
    .contributions-container {
        max-height: 400px;
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: var(--primary) var(--forms-bg);
    }

    /* Custom scrollbar for webkit browsers */
    .contributions-container::-webkit-scrollbar {
        width: 8px;
    }

    .contributions-container::-webkit-scrollbar-track {
        background: var(--forms-bg);
        border-radius: 4px;
    }

    .contributions-container::-webkit-scrollbar-thumb {
        background-color: var(--primary);
        border-radius: 4px;
    }

    /* Make sure header stays fixed */
    .table-header {
        position: sticky;
        top: 0;
        background-color: var(--forms-bg);
        z-index: 10;
    }
</style>

<div class="container mx-auto px-0 max-w-6xl mb-8" style="margin-bottom: 100px;">
    <h2 class="text-2xl font-bold text-white mb-4">Latest Contributions</h2>
    
    {#if loading}
    <div class="flex justify-center items-center min-h-[200px]">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
    </div>
    {:else}
    <div class="rounded-lg p-6" style="background-color: var(--forms-bg);">
        <div class="contributions-container">
            <table class="w-full">
                <thead>
                    <tr class="text-gray-400 text-sm table-header">
                        <th class="text-left p-4">Network</th>
                        <th class="text-left p-4">Asset</th>
                     
                        <th class="text-left p-4">Address</th>
                        <th class="text-left p-4">Time</th>
                        <th class="text-left p-4">Explorer</th>
                    </tr>
                </thead>
                <tbody>
                    {#each contributions as contribution}
                    <tr class="border-t border-gray-700 hover:bg-gray-800">
                        <td class="p-4">
                            <span class="capitalize">{contribution.network}</span>
                        </td>
                        <td class="p-4">
                            <span class="text-primary font-bold">{contribution.amount} {contribution.asset}</span>
                        </td>
                 
                        <td class="p-4">
                            {truncateAddress(contribution.address)}
                        </td>
                        <td class="p-4 text-sm text-gray-400">
                            {formatDate(contribution.timestamp)}
                        </td>
                        <td class="p-4">
                            <a 
                                href={getExplorerUrl(contribution.txid, contribution.network)}
                                target="_blank"
                                rel="noopener noreferrer"
                                class="text-primary hover:text-primary-dark"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                    <polyline points="15 3 21 3 21 9"></polyline>
                                    <line x1="10" y1="14" x2="21" y2="3"></line>
                                </svg>
                            </a>
                        </td>
                    </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    </div>
    {/if}
</div>