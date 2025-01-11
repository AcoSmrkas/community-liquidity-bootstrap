<script lang="ts">
  import { HERO_DESCRIPTION, LOGO_TEXT, API_HOST } from '$lib/common/const.js';
  import SuccessfulCampaigns from './SuccessfulCampaigns.svelte';
  import { connected_wallet_address } from "$lib/store/store";
  import { nFormatter } from '$lib/utils/utils.js';
  import { onMount } from 'svelte';
  import axios from "axios";
  import CampaignAlert from '$lib/components/ui/CampaignAlert.svelte';
  import Metrics from './metrics.svelte';
  
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
  <Metrics/>

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
  <div id="how-it-works" class="relative top-[-95px]"></div>

  <SuccessfulCampaigns/>
  



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