<script lang="ts">
  import { HERO_DESCRIPTION, LOGO_TEXT, FUNDING_CAMPAIGNS } from '$lib/common/const.js';
  import { connected_wallet_address } from "$lib/store/store";
  import { nFormatter } from '$lib/utils/utils.js';

  let walletConnected = false;
  
  $: connected_wallet_address.subscribe((value) => {
    walletConnected = value !== '';
  });

  // Calculate total stats
  $: totalErgoTargetAmount = FUNDING_CAMPAIGNS.ergo.reduce(
    (sum, campaign) => sum + campaign.assets.base.targetAmount, 
    0
  );
  $: totalCardanoTargetAmount = FUNDING_CAMPAIGNS.cardano.reduce(
    (sum, campaign) => sum + campaign.assets.base.targetAmount, 
    0
  );
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

  <!-- Stats Section -->
  <section class="pb-[75px]">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="stat-card p-[30px]">
        <h3 class="text-2xl font-bold text-main mb-2">{FUNDING_CAMPAIGNS.ergo.length + FUNDING_CAMPAIGNS.cardano.length}</h3>
        <p class="text-gray-300">Active Campaigns</p>
      </div>
      <div class="stat-card p-[30px]">
        <h3 class="text-2xl font-bold text-main mb-2">{nFormatter(totalErgoTargetAmount)} ERG</h3>
        <p class="text-gray-300">Total ERG Target</p>
      </div>
      <div class="stat-card p-[30px]">
        <h3 class="text-2xl font-bold text-main mb-2">{nFormatter(totalCardanoTargetAmount)} ADA</h3>
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

  <!-- Featured Campaigns -->
  <section class="pb-5">
    <h2 class="text-3xl font-bold text-white text-center mb-5">Featured campaigns</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[30px]">
      {#each [...FUNDING_CAMPAIGNS.ergo.slice(0, 2), ...FUNDING_CAMPAIGNS.cardano.slice(0, 1)] as campaign}
        <div class="campaign-card p-[30px] relative">
            <h3 class="text-xl font-bold text-primary mb-4">{campaign.title}</h3>
            <p class="text-gray-300 text-sm mb-6">{campaign.description}</p>
            
            <div class="space-y-4 mb-6">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  <img src={campaign.assets.base.icon} alt={campaign.assets.base.name} class="w-6 h-6"/>
                  <span class="text-white">{nFormatter(campaign.assets.base.targetAmount)} <span class="text-primary font-bold">{campaign.assets.base.name}</span></span>
                </div>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  <img src={campaign.assets.token.icon} alt={campaign.assets.token.name} class="w-6 h-6"/>
                  <span class="text-white">{nFormatter(campaign.assets.token.targetAmount)} <span class="text-primary font-bold">{campaign.assets.token.name}</span></span>
                </div>
              </div>
            </div>

            <a href="contribute" class="relative btn btn-secondary w-full block text-center px-4 py-2 rounded-lg transition-all hover:opacity-90" style="color: var(--background) !important;">
              View Campaign
            </a>
        </div>
      {/each}
    </div>
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