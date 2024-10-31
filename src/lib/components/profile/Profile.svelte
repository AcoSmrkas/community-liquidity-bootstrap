<script lang="ts">
  import { onMount } from 'svelte';
  import { API_HOST } from '$lib/common/const.js';
  import { connected_wallet_address } from "$lib/store/store.ts";
  import axios from 'axios';

  // Constants
  const RSN_PER_WERG = 2; 
  const TOTAL_CLB_TOKENS = 100; 
  const TOTAL_CONTRIBUTION_WERG = 100000;
  
  // User stats
  let stats = {
      address: 'N/A',
      ergo: {
          totalErg: 0,
          totalRsAda: 0,
          contributors: 0
      },
      cardano: {
          totalAda: 0,   
          totalRsErg: 0, 
          contributors: 0
      },
      txId: 'N/A'
  };

  let loading = true;
  let chain = 'ergo';

  $: totalErgContributed = stats.ergo.totalErg;
  $: rsnAirdrop = totalErgContributed * RSN_PER_WERG;
  $: poolSharePercentage = (totalErgContributed / TOTAL_CONTRIBUTION_WERG) * 100;
  $: clbTokensEstimate = (totalErgContributed / TOTAL_CONTRIBUTION_WERG) * TOTAL_CLB_TOKENS;

  let globgalStats = {
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

            globgalStats.ergo.totalErg = data.sum_erg;
            globgalStats.ergo.totalRsAda = data.sum_rsada;
            globgalStats.ergo.contributors = data.unique_addresses_ergo;

            globgalStats.cardano.totalAda = data.sum_ada;
            globgalStats.cardano.totalRsErg = data.sum_rserg;
            globgalStats.cardano.contributors = data.unique_addresses_cardano;
        } catch (error) {
            console.error("Error fetching Ergo stats:", error);
        }
    };

  onMount(async () => {
      await updateStats();
  });

  $: if ($connected_wallet_address) {
      updateStats();
  }

  async function updateStats() {
      if (!$connected_wallet_address) {
        loading = false;
        return;
      }

      loading = true;

      await fetchStats();
      await fetchAddressStats();

      loading = false;
  }

  const fetchAddressStats = async () => {
    try {
        const data = (await axios.get(`${API_HOST}/clb/getStatsByAddress?address=${$connected_wallet_address}`)).data;

        if (data.sum_erg > 0 || data.sum_rsada > 0) {
            stats.address = $connected_wallet_address;
            stats.ergo.totalErg = data.sum_erg;
            stats.ergo.totalRsAda = data.sum_rsada;
            stats.ergo.contributors = data.unique_addresses_ergo;
            stats.txId = data.last_txid;
            chain = 'ergo';
        } else if (data.sum_ada > 0 || data.sum_rserg > 0) {
            stats.address = $connected_wallet_address;
            stats.cardano.totalAda = data.sum_ada;
            stats.cardano.totalRsErg = data.sum_rserg;
            stats.cardano.contributors = data.unique_addresses_cardano;
            stats.txId = data.last_txid;
            chain = 'cardano';
        } else {
            stats.address = 'N/A';

            stats.ergo.totalErg = 0;
            stats.ergo.totalRsAda = 0;
            stats.ergo.contributors = 0;

            stats.cardano.totalAda = 0;
            stats.cardano.totalRsErg = 0;
            stats.cardano.contributors = 0;

            stats.txId = 'N/A';                
        }

    } catch (error) {
        console.error("Error fetching Ergo stats:", error);
    }
  };

  const formatNumber = (num: number) => {
      return num.toLocaleString(undefined, { 
          minimumFractionDigits: 2,
          maximumFractionDigits: 2 
      });
  };

  const formatPercentage = (num: number) => {
      return num.toFixed(1);
  };

  const truncateAddress = (address: string) => {
      if (!address || address == 'N/A') {
          return 'N/A';
      }

      return `${address.slice(0, 10)}...${address.slice(-10)}`;
  };
</script>

<style>
  :global(:root) {
    --bg-primary: #1a1325;
    --bg-secondary: #231a35;
    --bg-card: #1c1529;
    --text-primary: #ffffff;
    --text-secondary: #ffd700;
    --text-muted: #1c1529;
  }
</style>
<div class="container top-margin text-white mb-5">
    <div class="container mx-auto px-0 py-8 max-w-2xl">
        <h1 class="text-4xl font-bold text-white text-center mb-8">Profile</h1>
            <p class="text-gray-400 text-lg text-center">Track your contributions and rewards</p>
        </div>

        {#if !$connected_wallet_address}
            <p class="text-center">Please connect wallet to see stats.</p>
        {:else if loading}
            <div class="flex justify-center items-center min-h-[400px]">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
        {:else}
            <!-- Dashboard Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- Contributor Details Card -->
                <div class="bg-bg-card rounded-xl p-6 shadow-lg transition-all" style="background: var(--forms-bg);">

                    <h2 class="text-2xl font-bold text-primary mb-6 flex items-center">
                        <svg class="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Contributor Details
                    </h2>
                    <div class="space-y-6">
                        <div class="group" >
                            <div class="text-white font-mono bg-gray-700 p-4 rounded-lg mt-1 break-all hover:bg-gray-600 transition-colors" style="background: var(--footer);">

                            <label class="text-gray-400 text-sm mb-1">Address</label><br>
                                {truncateAddress(stats.address)}
                            </div>
                        </div>

                        <div class="group p-4 flex rounded-lg space-x-4" style="background: var(--footer);" >
                            {#if chain === 'ergo'}
                        <div class="flex-grow">
                            <label class="text-gray-400 text-sm">Total ERG Contributed</label>
                            <div class="text-2xl font-bold text-white mt-1">
                                {formatNumber(stats.ergo.totalErg)} <span class="text-primary">ERG</span>
                            </div>
                        </div>
                        <div class="flex-grow">
                            <label class="text-gray-400 text-sm">Total rsADA Contributed</label>
                            <div class="text-2xl font-bold text-white mt-1">
                                {formatNumber(stats.ergo.totalRsAda)} <span class="text-primary">rsADA</span>
                            </div>
                        </div>
                        {:else}
                        <div class="flex-grow">
                            <label class="text-gray-400 text-sm">Total ADA Contributed</label>
                            <div class="text-2xl font-bold text-white mt-1">
                                {formatNumber(stats.cardano.totalAda)} <span class="text-primary">ADA</span>
                            </div>
                        </div>
                        <div class="flex-grow">
                            <label class="text-gray-400 text-sm">Total rsERG Contributed</label>
                            <div class="text-2xl font-bold text-white mt-1">
                                {formatNumber(stats.cardano.totalRsErg)} <span class="text-primary">rsERG</span>
                            </div>
                        </div>
                        {/if}
                        </div>
                        <div>
                            <div class="text-white font-mono bg-gray-700 p-4 rounded-lg mt-1 break-all text-sm hover:bg-gray-600 transition-colors" style="background: var(--footer);">

                            <label class="text-gray-400 text-sm mb-1">Latest Transaction ID</label><br>
                                {truncateAddress(stats.txId)}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Projected Rewards Card -->
                <div class="bg-bg-card rounded-xl p-6 shadow-lg transition-all" style="background: var(--forms-bg);">

                    <h2 class="text-2xl font-bold text-primary mb-6 flex items-center">
                        <svg class="w-6 h-6 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Projected Rewards
                    </h2>
                    <div class="space-y-6">
                        <div class="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors" style="background: var(--footer);">
                            <label class="text-gray-400 text-sm">Projected RSN Airdrop</label>
                            <div class="text-2xl font-bold text-white mt-1">
                                {formatNumber(rsnAirdrop)} <span class="text-primary">RSN</span>
                            </div>
                        </div>
                        <div class="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors" style="background: var(--footer);">
                            <label class="text-gray-400 text-sm">Estimated CLB Tokens</label>
                            <div class="text-2xl font-bold text-white mt-1">
                                {formatNumber(clbTokensEstimate)} <span class="text-primary">CLB</span>
                            </div>
                        </div>
                        <div class="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors" style="background: var(--footer);">
                            <label class="text-gray-400 text-sm">Pool Share</label>
                            <div class="text-2xl font-bold text-white mt-1">
                                {formatPercentage(poolSharePercentage)}%
                            </div>
                            <div class="w-full bg-gray-600 rounded-full h-2 mt-2">
                                <div class="bg-info h-2 rounded-full" style="width: {poolSharePercentage}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        {/if}
    </div>
