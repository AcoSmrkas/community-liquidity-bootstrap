<script lang="ts">
    import { onMount } from 'svelte';
    
    // Goal tracking
    const TOTAL_GOAL = 500000; // 500k ERG
    
    // Example statistics
    let stats = {
        ergo: {
            totalErg: 15420.5,
            totalRsAda: 45680.75,
            contributors: 156
        },
        cardano: {
            totalAda: 89750.25,
            totalRsErg: 12450.8,
            contributors: 203
        }
    };
    
    // Calculate total ERG (ERG + rsERG)
    $: totalErgCollected = stats.ergo.totalErg + stats.cardano.totalRsErg;
    $: progressPercentage = (totalErgCollected / TOTAL_GOAL) * 100;
    $: remainingErg = TOTAL_GOAL - totalErgCollected;
    
    // Example recent contributions (moved to a store for better reactivity)
    let recentContributions = [
        { 
            time: '2024-02-23 14:32:15', 
            chain: 'Ergo',
            token: 'ERG',
            amount: 100.5,
            txId: '9f8a2...',
            status: 'Confirmed'
        },
        { 
            time: '2024-02-23 14:30:05', 
            chain: 'Cardano',
            token: 'ADA',
            amount: 500,
            txId: 'ae72b...',
            status: 'Pending'
        },
        { 
            time: '2024-02-23 14:28:45', 
            chain: 'Ergo',
            token: 'rsADA',
            amount: 200.75,
            txId: '7d23c...',
            status: 'Confirmed'
        }
    ];
    
    // Format numbers
    const formatNumber = (num: number) => {
        return num.toLocaleString(undefined, { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2 
        });
    };
    
    // Format percentage
    const formatPercentage = (num: number) => {
        return num.toFixed(1);
    };
    
    // Simulate live updates with better performance
    onMount(() => {
        const interval = setInterval(() => {
            const newContribution = {
                time: new Date().toISOString().replace('T', ' ').slice(0, 19),
                chain: Math.random() > 0.5 ? 'Ergo' : 'Cardano',
                token: ['ERG', 'rsADA', 'ADA', 'rsERG'][Math.floor(Math.random() * 4)],
                amount: Math.random() * 1000,
                txId: Math.random().toString(36).substring(2, 8) + '...',
                status: Math.random() > 0.3 ? 'Confirmed' : 'Pending'
            };
            
            recentContributions = [newContribution, ...recentContributions.slice(0, 9)];
            
            // Update total stats for demo purposes
            if (newContribution.token === 'ERG') {
                stats.ergo.totalErg += newContribution.amount;
            } else if (newContribution.token === 'rsERG') {
                stats.cardano.totalRsErg += newContribution.amount;
            }
        }, 5000);
    
        return () => clearInterval(interval);
    });
    </script>
    

<div class="container top-margin text-white mb-5">

    <div class="container mx-auto px-4 py-8 max-w-6xl">
        <h1 class="text-4xl font-bold text-yellow-400 text-center mb-8">Contribution Statistics</h1>
    
        <!-- Goal Progress Section -->
        <div class="rounded-lg p-6 mb-8" style="background-color: var(--forms-bg);">
            <h2 class="text-2xl font-bold text-yellow-400 mb-4">Goal Progress</h2>
            <div class="space-y-4">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-white">Total Collected: {formatNumber(totalErgCollected)} ERG</span>
                    <span class="text-white">Goal: {formatNumber(TOTAL_GOAL)} ERG</span>
                </div>
                <!-- Progress Bar -->
                <div class="w-full h-4 bg-purple-900/50 rounded-full overflow-hidden">
                    <div 
                        class="h-full bg-yellow-400 transition-all duration-500 ease-out"
                        style="width: {Math.min(progressPercentage, 100)}%"
                    ></div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div class="p-4 rounded bg-purple-900/50">
                        <p class="text-yellow-400 text-sm">Progress</p>
                        <p class="text-2xl font-bold text-white">{formatPercentage(progressPercentage)}%</p>
                    </div>
                    <div class="p-4 rounded bg-purple-900/50">
                        <p class="text-yellow-400 text-sm">Remaining</p>
                        <p class="text-2xl font-bold text-white">{formatNumber(remainingErg)} ERG</p>
                    </div>
                    <div class="p-4 rounded bg-purple-900/50">
                        <p class="text-yellow-400 text-sm">Total Contributors</p>
                        <p class="text-2xl font-bold text-white">{stats.ergo.contributors + stats.cardano.contributors}</p>
                    </div>
                </div>
            </div>
        </div>
    
        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <!-- Ergo Stats -->
            <div class="rounded-lg p-6" style="background-color: var(--forms-bg);">
                <h2 class="text-2xl font-bold text-yellow-400 mb-4">Ergo Chain</h2>
                <div class="grid grid-cols-1 gap-4">
                    <div class="p-4 rounded bg-purple-900/50">
                        <p class="text-yellow-400 text-sm">Total ERG Collected</p>
                        <p class="text-2xl font-bold text-white">{formatNumber(stats.ergo.totalErg)} ERG</p>
                    </div>
                    <div class="p-4 rounded bg-purple-900/50">
                        <p class="text-yellow-400 text-sm">Total rsADA Collected</p>
                        <p class="text-2xl font-bold text-white">{formatNumber(stats.ergo.totalRsAda)} rsADA</p>
                    </div>
                    <div class="p-4 rounded bg-purple-900/50">
                        <p class="text-yellow-400 text-sm">Contributors</p>
                        <p class="text-2xl font-bold text-white">{stats.ergo.contributors}</p>
                    </div>
                </div>
            </div>
    
            <!-- Cardano Stats -->
            <div class="rounded-lg p-6" style="background-color: var(--forms-bg);">
                <h2 class="text-2xl font-bold text-yellow-400 mb-4">Cardano Chain</h2>
                <div class="grid grid-cols-1 gap-4">
                    <div class="p-4 rounded bg-purple-900/50">
                        <p class="text-yellow-400 text-sm">Total ADA Collected</p>
                        <p class="text-2xl font-bold text-white">{formatNumber(stats.cardano.totalAda)} ADA</p>
                    </div>
                    <div class="p-4 rounded bg-purple-900/50">
                        <p class="text-yellow-400 text-sm">Total rsERG Collected</p>
                        <p class="text-2xl font-bold text-white">{formatNumber(stats.cardano.totalRsErg)} rsERG</p>
                    </div>
                    <div class="p-4 rounded bg-purple-900/50">
                        <p class="text-yellow-400 text-sm">Contributors</p>
                        <p class="text-2xl font-bold text-white">{stats.cardano.contributors}</p>
                    </div>
                </div>
            </div>
        </div>
    
        <!-- Recent Contributions Table -->
        <div class="rounded-lg p-6" style="background-color: var(--forms-bg);">
            <h2 class="text-2xl font-bold text-yellow-400 mb-4">Live Contributions</h2>
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead>
                        <tr>
                            <th class="text-left p-3 text-yellow-400 border-b border-purple-700">Time</th>
                            <th class="text-left p-3 text-yellow-400 border-b border-purple-700">Chain</th>
                            <th class="text-left p-3 text-yellow-400 border-b border-purple-700">Token</th>
                            <th class="text-right p-3 text-yellow-400 border-b border-purple-700">Amount</th>
                            <th class="text-left p-3 text-yellow-400 border-b border-purple-700">Transaction ID</th>
                            <th class="text-left p-3 text-yellow-400 border-b border-purple-700">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each recentContributions as contribution}
                            <tr class="hover:bg-purple-900/30 transition-colors">
                                <td class="p-3 text-white">{contribution.time}</td>
                                <td class="p-3 text-white">{contribution.chain}</td>
                                <td class="p-3 text-white">{contribution.token}</td>
                                <td class="p-3 text-white text-right">{formatNumber(contribution.amount)}</td>
                                <td class="p-3 text-white">{contribution.txId}</td>
                                <td class="p-3">
                                    <span class="px-2 py-1 rounded text-sm {contribution.status === 'Confirmed' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}">
                                        {contribution.status}
                                    </span>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    
</div>

<style>
  
</style>
