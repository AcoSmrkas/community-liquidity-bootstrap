<script lang="ts">
  import { onMount } from 'svelte';
  import { RECIPIENT_ADDRESS_ERGO, CF_TOKEN_ID } from "$lib/common/const.js";

  // Constants
  const RSN_PER_WERG = 2; // RSN per weighted ERG
  const TOTAL_CLB_TOKENS = 100; // Total CLB tokens
  const TOTAL_CONTRIBUTION_WERG = 100000; // Example total wERG for the pool (adjust as needed)
  
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

  $: totalErgContributed = stats.ergo.totalErg;
  $: weightedErg = totalErgContributed; // Assuming 1 ERG = 1 wERG on Ergo
  $: rsnAirdrop = weightedErg * RSN_PER_WERG;
  $: poolSharePercentage = (weightedErg / TOTAL_CONTRIBUTION_WERG) * 100;
  $: clbTokensEstimate = (weightedErg / TOTAL_CONTRIBUTION_WERG) * TOTAL_CLB_TOKENS;

  // Fetch stats on mount
  onMount(() => {
      fetchErgoStats();
  });

  const fetchErgoStats = async () => {
      try {
          // Fetch balance for ERG and rsADA
          const balanceResponse = await fetch(`https://api.ergoplatform.com/api/v1/addresses/${RECIPIENT_ADDRESS_ERGO}/balance/confirmed`);
          const balanceData = await balanceResponse.json();
          
          // Convert nanoErgs to ERG
          stats.ergo.totalErg = balanceData.nanoErgs / Math.pow(10, 9);
          
          // Find rsADA token balance
          const rsAdaToken = balanceData.tokens.find(token => token.tokenId === CF_TOKEN_ID);
          stats.ergo.totalRsAda = rsAdaToken ? rsAdaToken.amount / Math.pow(10, rsAdaToken.decimals) : 0;

          // Fetch transaction history
          const txResponse = await fetch(`https://api.ergoplatform.com/api/v1/addresses/${RECIPIENT_ADDRESS_ERGO}/transactions`);
          const txData = await txResponse.json();
          stats.ergo.contributors = txData.total;
          stats.ergo.txId = txData.transactions[0]?.id; // Store latest TXID for the dashboard
      } catch (error) {
          console.error("Error fetching Ergo stats:", error);
      }
  };

  // Format numbers to two decimal places
  const formatNumber = (num: number) => {
      return num.toLocaleString(undefined, { 
          minimumFractionDigits: 2,
          maximumFractionDigits: 2 
      });
  };

  // Format percentage to one decimal place
  const formatPercentage = (num: number) => {
      return num.toFixed(1);
  };
</script>

<div class="container top-margin text-white">
  <div class="container mx-auto px-4 max-w-6xl">
      <h1 class="text-4xl font-bold text-white text-center mb-8">Profile Dashboard</h1>

      <!-- Profile Information -->
      <div class="rounded-lg p-6 mb-8" style="background-color: var(--forms-bg);">
          <h2 class="text-2xl font-bold text-primary mb-4">Contributor Details</h2>
          <div class="space-y-4">
              <p class="text-white"><span class="font-bold">ERG Address:</span> {stats.ergo.address}</p>
              <p class="text-white"><span class="font-bold">Total ERG Contributed:</span> {formatNumber(totalErgContributed)} ERG</p>
              <p class="text-white"><span class="font-bold">Weighted ERG (wERG):</span> {formatNumber(weightedErg)} wERG</p>
              <p class="text-white"><span class="font-bold">Projected RSN Airdrop:</span> {formatNumber(rsnAirdrop)} RSN</p>
              <p class="text-white"><span class="font-bold">Estimated CLB Tokens:</span> {formatNumber(clbTokensEstimate)} CLB</p>
              <p class="text-white"><span class="font-bold">Pool Share (%PS):</span> {formatPercentage(poolSharePercentage)}%</p>
              <p class="text-white"><span class="font-bold">Latest Contribution TXID:</span> {stats.ergo.txId}</p>
          </div>
      </div>

      <!-- Breakdown Section -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <!-- Contribution Summary -->
          <div class="rounded-lg p-6" style="background-color: var(--forms-bg);">
              <h2 class="text-2xl font-bold text-primary mb-4">Contribution Summary</h2>
              <div class="grid grid-cols-1 gap-4">
                  <div class="p-4 rounded bg-footer">
                      <p class="text-primary text-sm">Total ERG Contributed</p>
                      <p class="text-2xl font-bold text-white">{formatNumber(totalErgContributed)} ERG</p>
                  </div>
                  <div class="p-4 rounded bg-footer">
                      <p class="text-primary text-sm">Weighted ERG (wERG)</p>
                      <p class="text-2xl font-bold text-white">{formatNumber(weightedErg)} wERG</p>
                  </div>
              </div>
          </div>

          <!-- Rewards Summary -->
          <div class="rounded-lg p-6" style="background-color: var(--forms-bg);">
              <h2 class="text-2xl font-bold text-primary mb-4">Projected Rewards</h2>
              <div class="grid grid-cols-1 gap-4">
                  <div class="p-4 rounded bg-footer">
                      <p class="text-primary text-sm">Projected RSN Airdrop</p>
                      <p class="text-2xl font-bold text-white">{formatNumber(rsnAirdrop)} RSN</p>
                  </div>
                  <div class="p-4 rounded bg-footer">
                      <p class="text-primary text-sm">Estimated CLB Tokens</p>
                      <p class="text-2xl font-bold text-white">{formatNumber(clbTokensEstimate)} CLB</p>
                  </div>
                  <div class="p-4 rounded bg-footer">
                      <p class="text-primary text-sm">Pool Share Percentage</p>
                      <p class="text-2xl font-bold text-white">{formatPercentage(poolSharePercentage)}%</p>
                  </div>
              </div>
          </div>
      </div>
  </div>
</div>
