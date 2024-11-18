<script lang="ts">
  import { HERO_DESCRIPTION, LOGO_TEXT, API_HOST } from '$lib/common/const.js';
  import { connected_wallet_address } from "$lib/store/store";
  import { nFormatter } from '$lib/utils/utils.js';
  import { onMount } from 'svelte';
  import axios from "axios";

  let walletConnected = false;
  let campaigns = [];
  let loading = true;
  let stats = {
    totalCampaigns: 0,
    totalErgoTarget: 0,
    totalCardanoTarget: 0
  };
  
  $: connected_wallet_address.subscribe((value) => {
    walletConnected = value !== '';
  });

  async function fetchCampaigns() {
    try {
      const response = await axios.get(`${API_HOST}/mew/fund/getCampaigns`);
      if (response.data?.items) {
        campaigns = response.data.items.map(campaign => ({
          ...campaign,
          network: campaign.base_name === 'ERG' ? 'ergo' : 'cardano'
        }));

        // Calculate stats
        stats = campaigns.reduce((acc, campaign) => {
          acc.totalCampaigns++;
          if (campaign.network === 'ergo') {
            acc.totalErgoTarget += parseFloat(campaign.base_target_amount) || 0;
          } else {
            acc.totalCardanoTarget += parseFloat(campaign.base_target_amount) || 0;
          }
          return acc;
        }, {
          totalCampaigns: 0,
          totalErgoTarget: 0,
          totalCardanoTarget: 0
        });
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    } finally {
      loading = false;
    }
  }

  onMount(fetchCampaigns);
</script>

<div class="container mx-auto px-4 mt-5">
  <!-- Hero Section remains the same -->
  <section class="py-20 text-center">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-5xl md:text-6xl font-bold text-white mb-6" style="font-family:'Manrope';">
        {@html LOGO_TEXT}
      </h1>
      <p class="text-xl text-gray-300 mb-10" style="font-family:'Azeret Mono';">
        {@html HERO_DESCRIPTION}
      </p>
      <div class="flex justify-center gap-4">
        <a href="contribute" class="btn-primary px-8 py-3 rounded-lg text-lg font-medium transition-all hover:opacity-90" style="color: var(--background) !important;width:225px;">
          Contribute Now
        </a>
        <a href="#how-it-works" class="btn-secondary px-8 py-3 rounded-lg text-lg font-medium transition-all hover:opacity-90" style="color: var(--background) !important;width:225px;">
          Learn More
        </a>
      </div>
    </div>
  </section>

  <!-- Updated Stats Section -->
  <section class="pb-[75px]">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="stat-card p-[30px]">
        <h3 class="text-2xl font-bold text-main mb-2">
          {loading ? '...' : stats.totalCampaigns}
        </h3>
        <p class="text-gray-300">Active Campaigns</p>
      </div>
      <div class="stat-card p-[30px]">
        <h3 class="text-2xl font-bold text-main mb-2">
          {loading ? '...' : `${nFormatter(stats.totalErgoTarget)} ERG`}
        </h3>
        <p class="text-gray-300">Total ERG Target</p>
      </div>
      <div class="stat-card p-[30px]">
        <h3 class="text-2xl font-bold text-main mb-2">
          {loading ? '...' : `${nFormatter(stats.totalCardanoTarget)} ADA`}
        </h3>
        <p class="text-gray-300">Total ADA Target</p>
      </div>
      <div class="stat-card p-[30px]">
        <h3 class="text-2xl font-bold text-main mb-2">2</h3>
        <p class="text-gray-300">Supported Chains</p>
      </div>
    </div>
  </section>

  <div id="how-it-works" class="relative top-[-95px]"></div>

  <!-- How It Works Section -->
  <section class="pb-[75px]">
    <h2 class="text-3xl font-bold text-white text-center mb-12">How it works?</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div class="process-card p-[30px]">
        <div class="text-main text-4xl font-bold mb-4">01</div>
        <h3 class="text-xl font-bold text-white mb-3">Choose Campaign</h3>
        <p class="text-gray-300">Select a liquidity bootstrapping campaign that interests you. Each campaign aims to create a new trading pair on either Ergo or Cardano.</p>
      </div>
      <div class="process-card p-[30px]">
        <div class="text-main text-4xl font-bold mb-4">02</div>
        <h3 class="text-xl font-bold text-white mb-3">Contribute Assets</h3>
        <p class="text-gray-300">Contribute either the base asset (ERG/ADA) or the project token to help bootstrap the liquidity pool's initial state.</p>
      </div>
      <div class="process-card p-[30px]">
        <div class="text-main text-4xl font-bold mb-4">03</div>
        <h3 class="text-xl font-bold text-white mb-3">Earn Rewards</h3>
        <p class="text-gray-300">Once the campaign reaches its target, the liquidity pool is created and contributors receive LP tokens proportional to their contribution.</p>
      </div>
    </div>
  </section>


  <!-- Updated Featured Campaigns Section -->
  <section class="pb-5">
    <h2 class="text-3xl font-bold text-white text-center mb-5">Featured campaigns</h2>
    {#if loading}
    <div class="text-center text-gray-300">Loading campaigns...</div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[30px]">
      {#each campaigns.slice(0, 3) as campaign}
        <div class="campaign-card p-[30px] relative">
          <h3 class="text-xl font-bold text-primary mb-4">{campaign.title}</h3>
          <p class="text-gray-300 text-sm mb-6">{campaign.description}</p>
          
          <div class="space-y-4 mb-6">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <img 
                  src={campaign.base_name === 'ERG' 
                    ? "https://spectrum.fi/logos/ergo/0000000000000000000000000000000000000000000000000000000000000000.svg"
                    : campaign.base_icon_url || "https://raw.githubusercontent.com/spectrum-finance/token-logos/master/logos/ada/asset1cvqgx3z9u8l54amkyk894tr23gyx63c6wpd7r2.svg"} 
                  alt={campaign.base_name} 
                  class="w-6 h-6"
                  on:error={(e) => e.target.src = "https://raw.githubusercontent.com/spectrum-finance/token-logos/master/logos/ada/asset1cvqgx3z9u8l54amkyk894tr23gyx63c6wpd7r2.svg"}
                />
                <span class="text-white">
                  {nFormatter(campaign.base_target_amount)} 
                  <span class="text-primary font-bold">{campaign.base_name}</span>
                </span>
              </div>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <img 
                  src={campaign.token_icon_url || "https://raw.githubusercontent.com/spectrum-finance/token-logos/master/logos/ergo/token.svg"} 
                  alt={campaign.token_name}
                  class="w-6 h-6"
                  on:error={(e) => e.target.src = "https://raw.githubusercontent.com/spectrum-finance/token-logos/master/logos/ergo/token.svg"}
                />
                <span class="text-white">
                  {nFormatter(campaign.target_raise)} 
                  <span class="text-primary font-bold">{campaign.token_name}</span>
                </span>
              </div>
            </div>
          </div>
  
          <a href="contribute" class="relative btn btn-secondary w-full block text-center px-4 py-2 rounded-lg transition-all hover:opacity-90" style="color: var(--background) !important;">
            View Campaign
          </a>
        </div>
      {/each}
    </div>
  {/if}
    <div class="text-center mt-[60px]">
      <a href="contribute" class="btn-primary px-8 py-3 rounded-lg text-lg font-medium transition-all hover:opacity-90" style="color: var(--background) !important;">
        View All Campaigns
      </a>
    </div>
  </section>
</div>


<style>
  .btn-primary {
    background-color: var(--main-color);
    color: white;
  }

  .btn-secondary {
    background-color: var(--forms-bg);
    color: white;
  }

  .text-main {
    color: var(--main-color);
  }

  .stat-card {
    background-color: var(--forms-bg);
    border-radius: 1rem;
    text-align: center;
  }

  .process-card {
    background-color: var(--forms-bg);
    border-radius: 1rem;
  }

  .campaign-card {
    background-color: var(--forms-bg);
    border-radius: 1rem;
    transition: transform 0.2s ease;
    display: flex;
    flex-direction: column;
    place-content: space-between;
  }

  .campaign-card:hover {
    transform: translateY(-5px);
  }
</style>