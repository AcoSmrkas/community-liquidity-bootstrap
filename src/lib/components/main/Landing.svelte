<script lang="ts">
  import { HERO_DESCRIPTION, LOGO_TEXT, API_HOST } from '$lib/common/const.js';
  import { connected_wallet_address } from "$lib/store/store";
  import { nFormatter } from '$lib/utils/utils.js';
  import { onMount } from 'svelte';
  import axios from "axios";
  import CampaignAlert from '$lib/components/ui/CampaignAlert.svelte';

  let walletConnected = false;
  let campaigns = [];
  let loading = true;
  let selectedStatus = 'active';
  let filteredCampaigns = [];

  let stats = {
    totalCampaigns: 0,
    totalErgoTarget: 0,
    totalCardanoTarget: 0,
    campaignTypes: {
        crowdfund: 0,
        mintpluslp: 0,
        multiassetlp: 0,
        ergassetlp: 0
    }
  };
  
  $: connected_wallet_address.subscribe((value) => {
    walletConnected = value !== '';
  });

  function getTimeLeft(dateStr: string): string {
    const difference = new Date(dateStr).getTime() - new Date().getTime();
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  }

  function getTimeAgo(dateStr: string): string {
    const difference = new Date().getTime() - new Date(dateStr).getTime();
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  }

  function processCampaignStatus(campaign) {
    const now = new Date().getTime();
    const startDate = new Date(campaign.start_date).getTime();
    const endDate = new Date(campaign.end_date).getTime();
    
    if (now < startDate) return 'upcoming';
    if (now > endDate) return 'ended';
    return 'active';
  }

  async function fetchCampaigns() {
    try {
      const response = await axios.get(`${API_HOST}/mew/fund/getCampaigns`);
      if (response.data?.items) {
        campaigns = response.data.items.map(campaign => ({
    ...campaign,
    network: campaign.base_name === 'ERG' ? 'ergo' : 'cardano',
    status: processCampaignStatus(campaign),
    base_raised: campaign.base_raised || 0,
    token_raised: campaign.token_raised || 0
}));

        // Calculate stats
        stats = campaigns.reduce((acc, campaign) => {
          acc.totalCampaigns++;
          if (campaign.network === 'ergo') {
            acc.totalErgoTarget += parseFloat(campaign.base_target_amount) || 0;
          } else {
            acc.totalCardanoTarget += parseFloat(campaign.base_target_amount) || 0;
          }
          // Count campaign types
          acc.campaignTypes[campaign.campaign_type]++;
          return acc;
        }, {
          totalCampaigns: 0,
          totalErgoTarget: 0,
          totalCardanoTarget: 0,
          campaignTypes: {
            crowdfund: 0,
            mintpluslp: 0,
            multiassetlp: 0,
            ergassetlp: 0
          }
        });

        // Initial filtering
        updateFilteredCampaigns();
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    } finally {
      loading = false;
    }
  }

  function updateFilteredCampaigns() {
    filteredCampaigns = campaigns
      .filter(campaign => campaign.status === selectedStatus)
      .slice(0, 3);
  }

  // Update filtered campaigns when status changes
  $: {
    if (campaigns.length > 0) {
      updateFilteredCampaigns();
    }
  }

  onMount(fetchCampaigns);
</script>

<div class="container mx-auto px-4 mt-5">
  <!-- Hero Section --> 
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
  <CampaignAlert />
  <!-- Stats Section -->
  <section class="pb-[75px]">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="stat-card p-[30px]">
        <h3 class="text-2xl font-bold text-main mb-2">
          {loading ? '...' : stats.totalCampaigns}
        </h3>
        <p class="text-gray-300">Total Campaigns</p>
        <div class="mt-2 grid grid-cols-2 gap-2 text-xs">
          <div>
            <span class="text-main">{stats.campaignTypes.crowdfund}</span> Crowdfund
          </div>
          <div>
            <span class="text-main">{stats.campaignTypes.mintpluslp}</span> Mint+LP
          </div>
          <div>
            <span class="text-main">{stats.campaignTypes.multiassetlp}</span> Multi LP
          </div>
          <div>
            <span class="text-main">{stats.campaignTypes.ergassetlp}</span> ERG+LP
          </div>
        </div>
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

  <!-- Campaign Types Section -->
  <section class="pb-[75px]">
    <h2 class="text-3xl font-bold text-white text-center mb-12">Campaign Types</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      <div class="process-card p-[30px]">
        <div class="text-center mb-4">
          <span class="px-3 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400 border-[0.5px] border-blue-500/20">
            Crowdfund
          </span>
        </div>
        <p class="text-gray-300">Simple fundraising campaigns in ERG or custom tokens with customizable contribution limits.</p>
      </div>
      <div class="process-card p-[30px]">
        <div class="text-center mb-4">
          <span class="px-3 py-1 rounded text-xs font-medium bg-cyan-500/20 text-cyan-400 border-[0.5px] border-cyan-500/20">
            Mint+LP
          </span>
        </div>
        <p class="text-gray-300">Mint new tokens and automatically create a liquidity pool paired with ERG.</p>
      </div>
      <div class="process-card p-[30px]">
        <div class="text-center mb-4">
          <span class="px-3 py-1 rounded text-xs font-medium bg-yellow-500/20 text-yellow-400 border-[0.5px] border-yellow-500/20">
            Multi LP
          </span>
        </div>
        <p class="text-gray-300">Create liquidity pools between any two tokens with balanced contributions.</p>
      </div>
      <div class="process-card p-[30px]">
        <div class="text-center mb-4">
          <span class="px-3 py-1 rounded text-xs font-medium bg-purple-500/20 text-purple-400 border-[0.5px] border-purple-500/20">
            ERG+LP
          </span>
        </div>
        <p class="text-gray-300">Create liquidity pools between ERG and any token with customizable ratios.</p>
      </div>
    </div>
  </section>

  <!-- Featured Campaigns Section -->
  <section class="pb-5">
    <h2 class="text-3xl font-bold text-white text-center mb-5">Featured campaigns</h2>
    
    <!-- Status Tabs -->
    <div class="flex justify-center space-x-4 mb-8">
      <button class="px-4 py-2 rounded-lg text-sm font-medium transition-all
                   {selectedStatus === 'active' ? 'bg-[var(--main-color)] text-bg' : 'bg-[var(--forms-bg)] text-gray-300'}"
              on:click={() => selectedStatus = 'active'}>
        Active
      </button>
      <button class="px-4 py-2 rounded-lg text-sm font-medium transition-all
                   {selectedStatus === 'upcoming' ? 'bg-[var(--main-color)] text-bg' : 'bg-[var(--forms-bg)] text-gray-300'}"
              on:click={() => selectedStatus = 'upcoming'}>
        Upcoming
      </button>
      <button class="px-4 py-2 rounded-lg text-sm font-medium transition-all
                   {selectedStatus === 'ended' ? 'bg-[var(--main-color)] text-bg' : 'bg-[var(--forms-bg)] text-gray-300'}"
              on:click={() => selectedStatus = 'ended'}>
        Ended
      </button>
    </div>

    {#if loading}
      <div class="text-center text-gray-300">Loading campaigns...</div>
    {:else if filteredCampaigns.length === 0}
      <div class="text-center text-gray-300">No {selectedStatus} campaigns found</div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[30px]">
        {#each filteredCampaigns as campaign (campaign.id)}
          <div class="campaign-card p-[30px] relative">
            <!-- Campaign Type Badge -->
            <div class="absolute top-4 right-4">
              {#if campaign.campaign_type === 'crowdfund'}
                <span class="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/20 text-blue-400 border-[0.5px] border-blue-500/20">
                  Fund
                </span>
              {:else if campaign.campaign_type === 'mintpluslp'}
                <span class="px-2 py-0.5 rounded text-[10px] font-medium bg-cyan-500/20 text-cyan-400 border-[0.5px] border-cyan-500/20">
                  Mint+LP
                </span>
              {:else if campaign.campaign_type === 'multiassetlp'}
                <span class="px-2 py-0.5 rounded text-[10px] font-medium bg-yellow-500/20 text-yellow-400 border-[0.5px] border-yellow-500/20">
                  Multi LP
                </span>
              {:else if campaign.campaign_type === 'ergassetlp'}
                <span class="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-500/20 text-purple-400 border-[0.5px] border-purple-500/20">
                  ERG+LP
                </span>
              {/if}
            </div>

            <h3 class="text-xl font-bold text-primary mb-4">{campaign.title}</h3>
            <p class="text-gray-300 text-sm mb-6">{campaign.description}</p>
            
            <!-- Token Info -->
            <div class="space-y-4 mb-6">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  <img 
                    src={campaign.base_name === 'ERG' 
                      ? "https://spectrum.fi/logos/ergo/0000000000000000000000000000000000000000000000000000000000000000.svg"
                      : campaign.base_icon_url || "https://raw.githubusercontent.com/spectrum-finance/token-logos/master/logos/ergo/token.svg"} 
                    alt={campaign.base_name} 
                    class="w-6 h-6"
                    on:error={(e) => e.target.src = "https://raw.githubusercontent.com/spectrum-finance/token-logos/master/logos/ergo/token.svg"}
                  />
                  <span class="text-white">
                    {nFormatter(campaign.base_target_amount)} 
                    <span class="text-primary font-bold">{campaign.base_name}</span>
                  </span>
                </div>
              </div>
                      {#if campaign.token_name}
                          <div class="flex items-center justify-between">
                              <div class="flex items-center space-x-2">
                                  <img 
                                      src={campaign.token_icon_url || "https://raw.githubusercontent.com/spectrum-finance/token-logos/master/logos/ergo/token.svg"} 
                                      alt={campaign.token_name}
                                      class="w-6 h-6"
                                      on:error={(e) => e.target.src = "https://raw.githubusercontent.com/spectrum-finance/token-logos/master/logos/ergo/token.svg"}
                                  />
                                  <span class="text-white">
                                      {nFormatter(campaign.token_target_amount)} 
                                      <span class="text-primary font-bold">{campaign.token_name}</span>
                                  </span>
                              </div>
                          </div>
                      {/if}
                  </div>

                  <!-- Time Info -->
<div class="mt-6 text-sm text-[var(--text-secondary)]">
  {#if campaign.status === 'upcoming'}
      Starts in {getTimeLeft(campaign.start_date)}
  {:else if campaign.status === 'active'}
      Ends in {getTimeLeft(campaign.end_date)}
  {:else}
      Ended {getTimeAgo(campaign.end_date)}
  {/if}
</div>

                  <!-- Action Button -->
<a href="/contribute" 
class="relative btn mt-4 w-full block text-center px-4 py-2 rounded-lg transition-all hover:opacity-90 
       {campaign.status === 'active' ? 'btn-primary' : 'btn-secondary'}" 
style="color: var(--background) !important;">
 {#if campaign.status === 'upcoming'}
     View Details
 {:else if campaign.status === 'active'}
     Contribute Now
 {:else}
     View Results
 {/if}
</a>
              </div>
          {/each}
      </div>
  {/if}

  <div class="text-center mt-[60px]">
      <a href="/contribute" class="btn-primary px-8 py-3 rounded-lg text-lg font-medium transition-all hover:opacity-90" style="color: var(--background) !important;">
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