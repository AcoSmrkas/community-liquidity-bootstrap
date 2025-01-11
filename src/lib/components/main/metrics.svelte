<script lang="ts">
    import { onMount } from 'svelte';
    import axios from "axios";
    import { API_HOST } from '$lib/common/const.js';
    import { nFormatter } from '$lib/utils/utils.js';
  
    let loading = true;
    let campaigns = [];
    let globalStats = {
      totalErgRaised: 0,
      totalErgTarget: 0,
      successfulCampaigns: 0,
      totalContributors: 0,
      campaignTypes: {},
      tokenMetrics: {}
    };
  
    // Function to generate a placeholder SVG
    function generatePlaceholderSVG(text: string) {
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48"><rect width="48" height="48" fill="%23e0e0e0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23666" font-family="Arial, sans-serif" font-size="16">${text.charAt(0)}</text></svg>`;
    }

    // Function to get token icon URL
    function getTokenIcon(campaign) {
      // ERG special case
      if (campaign.targets.token_name === 'ERG' || campaign.icons.base === 'ERG') {
        return "https://raw.githubusercontent.com/spectrum-finance/token-logos/master/logos/ergo/ERG.svg";
      }

      // Use base icon if available
      if (campaign.icons?.base) {
        return campaign.icons.base;
      }

      // Token-specific icon if available (you might want to expand this with a token logo mapping)
      // For now, we'll use a placeholder
      return generatePlaceholderSVG(campaign.targets.token_name || 'Token');
    }
  
    async function fetchData() {
      try {
        console.log('Fetching metrics data...');
        const response = await axios.get(`${API_HOST}/mew/fund/GlobalStats`);
        campaigns = response.data?.items || [];
        globalStats = calculateStats(campaigns);
        console.log('Global Stats:', globalStats);
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        loading = false;
      }
    }
  
    function calculateStats(campaigns) {
    return campaigns.reduce((stats, campaign) => {
      // Campaign Types
      stats.campaignTypes[campaign.type] = (stats.campaignTypes[campaign.type] || 0) + 1;
      
      // ERG Metrics (for all campaigns)
      stats.totalErgTarget += Number(campaign.targets.erg) || 0;
      stats.totalErgRaised += Number(campaign.raised.erg) || 0;
      
      // Count successful campaigns
      if (campaign.status.is_successful) {
        stats.successfulCampaigns++;
      }
      
      // Contributors for all campaigns
      stats.totalContributors += campaign.contributions.unique || 0;
      
      // Token Metrics (for all campaigns with tokens)
      if (campaign.targets.token_name) {
        const tokenKey = campaign.targets.token_name;
        if (!stats.tokenMetrics[tokenKey]) {
          stats.tokenMetrics[tokenKey] = { 
            raised: 0, 
            target: 0,
            campaigns: 0,
            icon: getTokenIcon(campaign)
          };
        }
        stats.tokenMetrics[tokenKey].raised += Number(campaign.raised.token) || 0;
        stats.tokenMetrics[tokenKey].target += Number(campaign.targets.token) || 0;
        stats.tokenMetrics[tokenKey].campaigns += 1;
      }
      
      return stats;
    }, {
      totalErgRaised: 0,
      totalErgTarget: 0,
      successfulCampaigns: 0,
      totalContributors: 0,
      campaignTypes: {},
      tokenMetrics: {}
    });
  }

    onMount(fetchData);
  </script>
  
  <section class="metrics-section">
    <div class="max-w-7xl mx-auto">
      <h2 class="text-4xl font-bold text-white text-center mb-12">Platform Metrics</h2>
      
      {#if loading}
        <div class="text-center text-gray-300">Loading metrics...</div>
      {:else}
        <!-- Main Metrics Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <!-- ERG Raised -->
          <div class="metric-card">
            <h3 class="text-3xl font-bold" style="color: var(--main-color)">
              {nFormatter(globalStats.totalErgRaised)} ERG
            </h3>
            <p class="text-gray-200 mt-2">Total ERG Raised</p>
          </div>
  
          <!-- Success Rate -->
          <div class="metric-card">
            <h3 class="text-3xl font-bold" style="color: var(--main-color)">
              {globalStats.successfulCampaigns} / {campaigns.length}
            </h3>
            <p class="text-gray-200 mt-2">Successful Campaigns</p>
          </div>
  
          <!-- Contributors -->
          <div class="metric-card">
            <h3 class="text-3xl font-bold" style="color: var(--main-color)">
              {nFormatter(globalStats.totalContributors)}
            </h3>
            <p class="text-gray-200 mt-2">Unique Contributors</p>
          </div>
  
          <!-- Campaign Types -->
          <div class="metric-card">
            <h3 class="text-3xl font-bold" style="color: var(--main-color)">
              {Object.keys(globalStats.campaignTypes).length}
            </h3>
            <p class="text-gray-200 mt-2">Campaign Types</p>
            <div class="grid grid-cols-2 gap-2 text-xs mt-4">
              {#each Object.entries(globalStats.campaignTypes) as [type, count]}
                <div class="type-stat">
                  <span class="text-gray-400">{type}:</span>
                  <span style="color: var(--main-color)" class="ml-1">{count}</span>
                </div>
              {/each}
            </div>
          </div>
        </div>
  
       

      {/if}
    </div>
  </section>
  
  <style>
    .assets-section {
      @apply mt-12;
    }
    .metric-card {
    @apply p-6 rounded-xl border;
    background-color: var(--forms-bg);
    border-color: var(--forms-bg);
    @apply text-center transition-all duration-300
           flex flex-col items-center justify-center min-h-[160px];
  }
    .assets-row {
      @apply flex gap-4 overflow-x-auto pb-4;
    }
  
    .asset-card {
      @apply p-4 rounded-xl border flex flex-col items-center;
      background-color: var(--forms-bg);
      border-color: var(--main-color);
      min-width: 160px;
      max-width: 180px;
    }
  
    .stats-container {
      @apply w-full space-y-2 mt-2;
    }
  
    .stat-item {
      @apply flex flex-col items-center p-2 rounded-lg;
      background-color: var(--background);
    }
  
    .asset-card:hover {
      @apply transform -translate-y-1;
      box-shadow: 0 4px 20px rgba(var(--main-color-rgb), 0.1);
    }
  </style>