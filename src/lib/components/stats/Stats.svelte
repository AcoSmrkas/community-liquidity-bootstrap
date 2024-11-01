<script lang="ts">
    import { onMount } from 'svelte';
    import { API_HOST } from '$lib/common/const.js';
    import axios from 'axios';
    import LatestContributions from '$lib/components/stats/LatestContributions.svelte';
    
    let loading = true;
    let stats = {
        ergo: {
            totalErg: 0,
            totalRsAda: 0,
            contributors: 0
        },
        cardano: {
            totalAda: 0,   
            totalRsErg: 0, 
            contributors: 0
        }
    };

    const fetchStats = async () => {
        try {
            const data = (await axios.get(`${API_HOST}/clb/getStats`)).data;

            stats.ergo.totalErg = data.sum_erg;
            stats.ergo.totalRsAda = data.sum_rsada;
            stats.ergo.contributors = data.unique_addresses_ergo;

            stats.cardano.totalAda = data.sum_ada;
            stats.cardano.totalRsErg = data.sum_rserg;
            stats.cardano.contributors = data.unique_addresses_cardano;
        } catch (error) {
            console.error("Error fetching Ergo stats:", error);
        }
    };

    // Fetch stats on mount
    onMount(async () => {
        loading = true;
        await fetchStats();
        loading = false;
    });

    // Format numbers
    const formatNumber = (num: number) => {
        return num.toLocaleString(undefined, { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2 
        });
    };
</script>

<div class="container top-margin text-white">
    <div class="container mx-auto px-0 max-w-6xl">
        <h1 class="text-4xl font-bold text-white text-center mb-8">Contribution Stats</h1>

        {#if loading}
        <div class="flex justify-center items-center min-h-[400px]">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
        {:else}
        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <!-- Ergo Stats -->
            <div class="rounded-lg p-6" style="background-color: var(--forms-bg);">
                <h2 class="text-2xl font-bold text-white mb-4">Ergo</h2>
                <div class="grid grid-cols-1 gap-4">
                    <div class="p-4 rounded bg-footer">
                        <p class="text-gray-400 text-sm">Total <span class="text-primary font-bold">ERG</span> collected</p>
                        <p class="text-2xl font-bold text-white">{formatNumber(stats.ergo.totalErg)} <span class="text-primary font-bold">ERG</span></p>
                    </div>
                    <div class="p-4 rounded bg-footer">
                        <p class="text-gray-400 text-sm">Total <span class="text-primary font-bold">rsADA</span> collected</p>
                        <p class="text-2xl font-bold text-white">{formatNumber(stats.ergo.totalRsAda)} <span class="text-primary font-bold">rsADA</span></p>
                    </div>
                    <div class="p-4 rounded bg-footer">
                        <p class="text-gray-400 text-sm">Contributors</p>
                        <p class="text-2xl font-bold text-white">{stats.ergo.contributors}</p>
                    </div>
                </div>
            </div>
    
            <!-- Cardano Stats (Disabled) -->
            <div class="rounded-lg p-6" style="background-color: var(--forms-bg);">
                <h2 class="text-2xl font-bold text-white mb-4">Cardano</h2>
                <div class="grid grid-cols-1 gap-4">
                    <div class="p-4 rounded bg-footer">
                        <p class="text-gray-400 text-sm">Total <span class="text-primary font-bold">ADA</span> collected</p>
                        <p class="text-2xl font-bold text-white">{formatNumber(stats.cardano.totalAda)} <span class="text-primary font-bold">ADA</span></p>
                    </div>
                    <div class="p-4 rounded bg-footer">
                        <p class="text-gray-400 text-sm">Total <span class="text-primary font-bold">rsERG</span> collected</p>
                        <p class="text-2xl font-bold text-white">{formatNumber(stats.cardano.totalRsErg)} <span class="text-primary font-bold">rsERG</span></p>
                    </div>
                    <div class="p-4 rounded bg-footer">
                        <p class="text-gray-400 text-sm">Contributors</p>
                        <p class="text-2xl font-bold text-white">{stats.cardano.contributors}</p>
                    </div>
                </div>
            </div>
        </div>
        <LatestContributions />
        {/if}
    </div>
</div>
