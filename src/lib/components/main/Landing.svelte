<script lang="ts">
  import { onMount } from 'svelte';
  import { HERO_DESCRIPTION, HERO_IMAGE, LOGO_TEXT } from '$lib/common/const.js';
  import { offers, selected_wallet, connected_wallet_address } from "$lib/store/store";
  import { nFormatter, showCustomToast, getConnectedWalletAddress, isWalletConected } from '$lib/utils/utils.js';
  import { get } from 'svelte/store';
  import { ErgoAddress } from "@fleet-sdk/core";
  import CampaignCard from './CampaignCard.svelte';
  import TokenPrices from './TokenPrices.svelte';
  import Dash from './dash.svelte';

  let showModal = false;
  let connectedWalletAddress = '';
  let walletConnected = false;
  let campaigns = [];

  function toggleModal() {
    showModal = !showModal;
  }

  $: connected_wallet_address.subscribe((value) => {
    if (value == '') {
      walletConnected = false;
    } else {
      walletConnected = true;
    }
  });
   
  async function fetchCampaigns() {
    try {
      const response = await fetch('https://stats.mewfinance.com/dex/campaigns/campaigns.php');
      const data = await response.json();
      campaigns = data.items;
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  }

  onMount(() => {
    fetchCampaigns();
    // Auto refresh campaigns every 30 seconds
    const interval = setInterval(fetchCampaigns, 30000);
    return () => clearInterval(interval);
  });
</script>

<div class="container">
  <section class="mt-[100px]">
    <div class="max-w-screen-xl px-0 px-sm-4 pt-2 pb-5 mb-5 mx-auto lg:gap-8 xl:gap-0 lg:py-16 lg:pt-28">
      <div class="text-center mr-auto place-self-center lg:col-span-7">
        <h1 class="mt-4 text-5xl leading-[60px] tracking-tight md:text-6xl md:leading-11 xl:text-6xl xl:leading-12 text-white font-bold" style="font-family:'Manrope';">
          {@html LOGO_TEXT}
        </h1>
        <p class="mb-9 mt-8 text-light lg:mb-8 md:text-lg lg:text-md py-2" style="font-family:'Azeret Mono';">{@html HERO_DESCRIPTION}<br></p>
        <a href="contribute">
          <button class="btn btn-primary" style="padding:10px 25px !important;font-size:1.15rem !important;">
            Contribute
          </button>
        </a>
      </div>
    </div>
  </section>
<Dash/>
<TokenPrices/>
  <!-- Campaigns Section -->
  <section class="mt-10">
    <h2 class="text-3xl font-bold text-white text-center mb-8">Active Campaigns</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-6 md:mt-10">
      {#if campaigns.length > 0}
        {#each campaigns as campaign (campaign.id)}
          <CampaignCard {campaign} />
        {/each}
      {:else}
        <div class="col-span-full text-center text-gray-400 py-10">
          Loading campaigns...
        </div>
      {/if}
    </div>
  </section>
</div>

<style>
  .container {
    max-width: 1200px;
    margin: auto;
    padding: 20px;
  }
  .card {
    background-color: var(--main-color);
    border-radius: 0.5rem;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  .card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 12px rgba(0, 0, 0, 0.2);
    background-color: #FFF;
  }
  .card-link {
    display: block;
    text-decoration: none;
    color: inherit;
  }

  .card-content {
    padding: 20px;
    text-align: center;
  }

  .card-title {
    font-size: 1.5rem;
    font-weight: bold;
    color: #000000;
    margin-bottom: 10px;
  }

  .card-description {
    font-size: 1rem;
    color: #000000;
  }

  /* Responsive styling */
  @media (min-width: 640px) {
    .card {
      width: 100%;
      max-width: 100%;
    }
  }
  
  @media (min-width: 768px) {
    .card {
      width: 100%;
      max-width: 100%;
    }
  }

  @media (min-width: 1024px) {
    .card {
      width: 100%;
      max-width: 100%;
    }
  }
</style>

