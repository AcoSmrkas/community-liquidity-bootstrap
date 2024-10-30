<script lang="ts">
  import { onMount } from 'svelte';
  import { RECIPIENT_ADDRESS_ERGO, CF_TOKEN_ID } from "$lib/common/const.js";

  // Constants
  const RSN_PER_WERG = 2; 
  const TOTAL_CLB_TOKENS = 100; 
  const TOTAL_CONTRIBUTION_WERG = 100000;
  
  // User stats
  let stats = {
      ergo: {
          address: RECIPIENT_ADDRESS_ERGO,
          totalErg: 0,
          totalRsAda: 0,
          contributors: 0,
          txId: ''
      }
  };

  let loading = true;

  $: totalErgContributed = stats.ergo.totalErg;
  $: rsnAirdrop = totalErgContributed * RSN_PER_WERG;
  $: poolSharePercentage = (totalErgContributed / TOTAL_CONTRIBUTION_WERG) * 100;
  $: clbTokensEstimate = (totalErgContributed / TOTAL_CONTRIBUTION_WERG) * TOTAL_CLB_TOKENS;

  onMount(() => {
      fetchErgoStats();
  });

  const fetchErgoStats = async () => {
      try {
          const balanceResponse = await fetch(`https://api.ergoplatform.com/api/v1/addresses/${RECIPIENT_ADDRESS_ERGO}/balance/confirmed`);
          const balanceData = await balanceResponse.json();
          
          stats.ergo.totalErg = balanceData.nanoErgs / Math.pow(10, 9);
          
          const rsAdaToken = balanceData.tokens.find(token => token.tokenId === CF_TOKEN_ID);
          stats.ergo.totalRsAda = rsAdaToken ? rsAdaToken.amount / Math.pow(10, rsAdaToken.decimals) : 0;

          const txResponse = await fetch(`https://api.ergoplatform.com/api/v1/addresses/${RECIPIENT_ADDRESS_ERGO}/transactions`);
          const txData = await txResponse.json();
          stats.ergo.contributors = txData.total;
          stats.ergo.txId = txData.transactions[0]?.id;
      } catch (error) {
          console.error("Error fetching Ergo stats:", error);
      } finally {
          loading = false;
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
      return `${address.slice(0, 6)}...${address.slice(-6)}`;
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

        {#if loading}
            <div class="flex justify-center items-center min-h-[400px]">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
        {:else}
            <!-- Dashboard Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- Contributor Details Card -->
                <div class="bg-bg-card rounded-xl p-6 shadow-lg border transition-all" style="background: var(--forms-bg); border-color: var(--main-color);">

                    <h2 class="text-2xl font-bold text-text-primary mb-6 flex items-center">
                        <svg class="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Contributor Details
                    </h2>
                    <div class="space-y-6">
                        <div class="group" >
                            <label class="text-gray-400 text-sm">ERG Address</label>
                            <div class="text-text-primary font-mono bg-gray-700 p-3 rounded-lg mt-1 break-all hover:bg-gray-600 transition-colors" style="background: var(--footer);">
                                {truncateAddress(stats.ergo.address)}
                            </div>
                        </div>
                        <div>
                            <label class="text-gray-400 text-sm">Total ERG Contributed</label>
                            <div class="text-2xl font-bold text-text-primary mt-1">
                                {formatNumber(totalErgContributed)} ERG
                            </div>
                        </div>
                        <div>
                            <label class="text-gray-400 text-sm">Latest Transaction ID</label>
                            <div class="text-text-primary font-mono bg-gray-700 p-3 rounded-lg mt-1 break-all text-sm hover:bg-gray-600 transition-colors" style="background: var(--footer);">
                                {truncateAddress(stats.ergo.txId)}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Projected Rewards Card -->
                <div class="bg-bg-card rounded-xl p-6 shadow-lg border transition-all" style="background: var(--forms-bg); border-color: var(--main-color);">

                    <h2 class="text-2xl font-bold text-text-primary mb-6 flex items-center">
                        <svg class="w-6 h-6 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Projected Rewards
                    </h2>
                    <div class="space-y-6">
                        <div class="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors" style="background: var(--footer);">
                            <label class="text-gray-400 text-sm">Projected RSN Airdrop</label>
                            <div class="text-2xl font-bold text-text-primary mt-1">
                                {formatNumber(rsnAirdrop)} RSN
                            </div>
                        </div>
                        <div class="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors" style="background: var(--footer);">
                            <label class="text-gray-400 text-sm">Estimated CLB Tokens</label>
                            <div class="text-2xl font-bold text-text-primary mt-1">
                                {formatNumber(clbTokensEstimate)} CLB
                            </div>
                        </div>
                        <div class="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors" style="background: var(--footer);">
                            <label class="text-gray-400 text-sm">Pool Share</label>
                            <div class="text-2xl font-bold text-text-primary mt-1">
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
