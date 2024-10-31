<script lang="ts">
    import { onMount } from 'svelte';
    import { RSADA_TOKEN_ID, RECIPIENT_ADDRESS_ERGO } from "$lib/common/const.js";

    const TOTAL_GOAL = 500000; // 500k ERG
    
    let stats = {
        ergo: {
            totalErg: 0,
            totalRsAda: 0,
            contributors: 0
        },
        cardano: {
            totalAda: 0,    // Disabled for now
            totalRsErg: 0,  // Disabled for now
            contributors: 0 // Disabled for now
        }
    };

    $: totalErgCollected = stats.ergo.totalErg;
    $: progressPercentage = (totalErgCollected / TOTAL_GOAL) * 100;
    $: remainingErg = TOTAL_GOAL - totalErgCollected;

    const fetchErgoStats = async () => {
        try {
            // Fetch balance for ERG and rsADA
            const balanceResponse = await fetch(`https://api.ergoplatform.com/api/v1/addresses/${RECIPIENT_ADDRESS_ERGO}/balance/confirmed`);
            const balanceData = await balanceResponse.json();

            // Convert nanoErgs to ERG
            stats.ergo.totalErg = balanceData.nanoErgs / Math.pow(10, 9);

            // Find rsADA token balance
            const rsAdaToken = balanceData.tokens.find(token => token.tokenId === RSADA_TOKEN_ID);
            stats.ergo.totalRsAda = rsAdaToken ? rsAdaToken.amount / Math.pow(10, rsAdaToken.decimals) : 0;

            // Fetch transaction history to count contributors
            const txResponse = await fetch(`https://api.ergoplatform.com/api/v1/addresses/${RECIPIENT_ADDRESS_ERGO}/transactions`);
            const txData = await txResponse.json();

            // Get total contributors from the 'total' field
            stats.ergo.contributors = txData.total;
        } catch (error) {
            console.error("Error fetching Ergo stats:", error);
        }
    };

    // Fetch stats on mount
    onMount(() => {
        fetchErgoStats();
    });

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
</script>


<div class="container top-margin text-white">

    <div class="container mx-auto px-4 max-w-6xl">
        <h1 class="text-4xl font-bold text-white text-center mb-8">Contribution Stats</h1>
    
        <!-- Goal Progress Section -->
        <div class="rounded-lg p-6 mb-8" style="background-color: var(--forms-bg);">
            <h2 class="text-2xl font-bold text-primary mb-4">Goal Progress</h2>
            <div class="space-y-4">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-white">Total Collected: {formatNumber(totalErgCollected)} <span class="text-primary font-bold">ERG</span></span>
                    <span class="text-white">Goal: {formatNumber(TOTAL_GOAL)} <span class="text-primary font-bold">ERG</span></span>
                </div>
                <!-- Progress Bar -->
                <div class="w-full h-4 bg-footer rounded-full overflow-hidden">
                    <div 
                        class="h-full bg-yellow-400 transition-all duration-500 ease-out"
                        style="width: {Math.min(progressPercentage, 100)}%"
                    ></div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div class="p-4 rounded bg-footer">
                        <p class="text-primary text-sm">Progress</p>
                        <p class="text-2xl font-bold text-white">{formatPercentage(progressPercentage)}%</p>
                    </div>
                    <div class="p-4 rounded bg-footer">
                        <p class="text-primary text-sm">Remaining</p>
                        <p class="text-2xl font-bold text-white">{formatNumber(remainingErg)} <span class="text-primary font-bold">ERG</span></p>
                    </div>
                    <div class="p-4 rounded bg-footer">
                        <p class="text-primary text-sm">Total Contributors</p>
                        <p class="text-2xl font-bold text-white">{stats.ergo.contributors}</p>
                    </div>
                </div>
            </div>
        </div>
    
        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <!-- Ergo Stats -->
            <div class="rounded-lg p-6" style="background-color: var(--forms-bg);">
                <h2 class="text-2xl font-bold text-primary mb-4">Ergo Chain</h2>
                <div class="grid grid-cols-1 gap-4">
                    <div class="p-4 rounded bg-footer">
                        <p class="text-primary text-sm">Total <span class="text-primary font-bold">ERG</span> Collected</p>
                        <p class="text-2xl font-bold text-white">{formatNumber(stats.ergo.totalErg)} <span class="text-primary font-bold">ERG</span></p>
                    </div>
                    <div class="p-4 rounded bg-footer">
                        <p class="text-primary text-sm">Total <span class="text-primary font-bold">rsADA</span> Collected</p>
                        <p class="text-2xl font-bold text-white">{formatNumber(stats.ergo.totalRsAda)} <span class="text-primary font-bold">rsADA</span></p>
                    </div>
                    <div class="p-4 rounded bg-footer">
                        <p class="text-primary text-sm">Contributors</p>
                        <p class="text-2xl font-bold text-white">{stats.ergo.contributors}</p>
                    </div>
                </div>
            </div>
    
            <!-- Cardano Stats (Disabled) -->
            <div class="rounded-lg p-6" style="background-color: var(--forms-bg);">
                <h2 class="text-2xl font-bold text-primary mb-4">Cardano Chain</h2>
                <div class="grid grid-cols-1 gap-4">
                    <div class="p-4 rounded bg-footer">
                        <p class="text-primary text-sm">Total <span class="text-primary font-bold">ADA</span> Collected</p>
                        <p class="text-2xl font-bold text-white">0 <span class="text-primary font-bold">ADA</span></p>
                    </div>
                    <div class="p-4 rounded bg-footer">
                        <p class="text-primary text-sm">Total <span class="text-primary font-bold">rsERG</span> Collected</p>
                        <p class="text-2xl font-bold text-white">0 <span class="text-primary font-bold">rsERG</span></p>
                    </div>
                    <div class="p-4 rounded bg-footer">
                        <p class="text-primary text-sm">Contributors</p>
                        <p class="text-2xl font-bold text-white">0</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
