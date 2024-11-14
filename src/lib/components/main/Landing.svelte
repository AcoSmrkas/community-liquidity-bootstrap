<script lang="ts">
  import { HERO_DESCRIPTION, LOGO_TEXT, FUNDING_CAMPAIGNS } from '$lib/common/const.js';
  import { offers, selected_wallet, connected_wallet_address } from "$lib/store/store";
  import { nFormatter, showCustomToast, getConnectedWalletAddress, isWalletConected } from '$lib/utils/utils.js';
  import { get } from 'svelte/store';
  import { ErgoAddress } from "@fleet-sdk/core";

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

<div class="container mx-auto px-4">
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
        <a href="contribute" class="btn-primary px-8 py-3 rounded-lg text-lg font-medium transition-all hover:opacity-90">
          Contribute Now
        </a>
        <a href="#how-it-works" class="btn-secondary px-8 py-3 rounded-lg text-lg font-medium transition-all hover:opacity-90">
          Learn More
        </a>
      </div>
    </div>
  </section>

  <!-- Stats Section -->
  <section class="py-16">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="stat-card">
        <h3 class="text-2xl font-bold text-main mb-2">{FUNDING_CAMPAIGNS.ergo.length + FUNDING_CAMPAIGNS.cardano.length}</h3>
        <p class="text-gray-300">Active Campaigns</p>
      </div>
      <div class="stat-card">
        <h3 class="text-2xl font-bold text-main mb-2">{totalErgoTargetAmount} ERG</h3>
        <p class="text-gray-300">Total ERG Target</p>
      </div>
      <div class="stat-card">
        <h3 class="text-2xl font-bold text-main mb-2">{totalCardanoTargetAmount} ADA</h3>
        <p class="text-gray-300">Total ADA Target</p>
      </div>
      <div class="stat-card">
        <h3 class="text-2xl font-bold text-main mb-2">2</h3>
        <p class="text-gray-300">Supported Chains</p>
      </div>
    </div>
  </section>

  <!-- How It Works Section -->
  <section id="how-it-works" class="py-16">
    <h2 class="text-3xl font-bold text-white text-center mb-12">How It Works</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div class="process-card">
        <div class="text-main text-4xl font-bold mb-4">01</div>
        <h3 class="text-xl font-bold text-white mb-3">Choose Campaign</h3>
        <p class="text-gray-300">Select a liquidity bootstrapping campaign that interests you. Each campaign aims to create a new trading pair on either Ergo or Cardano.</p>
      </div>
      <div class="process-card">
        <div class="text-main text-4xl font-bold mb-4">02</div>
        <h3 class="text-xl font-bold text-white mb-3">Contribute Assets</h3>
        <p class="text-gray-300">Contribute either the base asset (ERG/ADA) or the project token to help bootstrap the liquidity pool's initial state.</p>
      </div>
      <div class="process-card">
        <div class="text-main text-4xl font-bold mb-4">03</div>
        <h3 class="text-xl font-bold text-white mb-3">Earn Rewards</h3>
        <p class="text-gray-300">Once the campaign reaches its target, the liquidity pool is created and contributors receive LP tokens proportional to their contribution.</p>
      </div>
    </div>
  </section>

  <!-- Featured Campaigns -->
  <section class="py-16">
    <h2 class="text-3xl font-bold text-white text-center mb-12">Featured Campaigns</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each [...FUNDING_CAMPAIGNS.ergo.slice(0, 2), ...FUNDING_CAMPAIGNS.cardano.slice(0, 1)] as campaign}
        <div class="campaign-card">
          <div class="p-6">
            <h3 class="text-xl font-bold text-white mb-4">{campaign.title}</h3>
            <p class="text-gray-300 text-sm mb-6">{campaign.description}</p>
            
            <div class="space-y-4 mb-6">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  <img src={campaign.assets.base.icon} alt={campaign.assets.base.name} class="w-6 h-6"/>
                  <span class="text-white">{campaign.assets.base.targetAmount} {campaign.assets.base.name}</span>
                </div>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  <img src={campaign.assets.token.icon} alt={campaign.assets.token.name} class="w-6 h-6"/>
                  <span class="text-white">{campaign.assets.token.targetAmount} {campaign.assets.token.name}</span>
                </div>
              </div>
            </div>

            <a href="contribute" class="btn-secondary w-full block text-center px-4 py-2 rounded-lg transition-all hover:opacity-90">
              View Campaign
            </a>
          </div>
        </div>
      {/each}
    </div>
    <div class="text-center mt-8">
      <a href="contribute" class="btn-primary px-8 py-3 rounded-lg text-lg font-medium transition-all hover:opacity-90">
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
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .text-main {
    color: var(--main-color);
  }

  .stat-card {
    background-color: var(--forms-bg);
    padding: 2rem;
    border-radius: 1rem;
    text-align: center;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .process-card {
    background-color: var(--forms-bg);
    padding: 2rem;
    border-radius: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .campaign-card {
    background-color: var(--forms-bg);
    border-radius: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: transform 0.2s ease;
  }

  .campaign-card:hover {
    transform: translateY(-5px);
  }
</style>