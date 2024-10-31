<script lang="ts">
  import { HERO_DESCRIPTION, HERO_IMAGE, LOGO_TEXT } from '$lib/common/const.js';
  import { offers, selected_wallet, connected_wallet_address } from "$lib/store/store";
  import { nFormatter, showCustomToast, getConnectedWalletAddress, isWalletConected } from '$lib/utils/utils.js';
  import { get } from 'svelte/store';
  import { ErgoAddress } from "@fleet-sdk/core";

  let showModal = false;
  let connectedWalletAddress = '';
  let walletConnected = false;

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

</script>

<div class="container">
  <section class="mt-[100px]">
    <div class="max-w-screen-xl px-0 px-sm-4 pt-2 pb-5 mb-5 mx-auto lg:gap-8 xl:gap-0 lg:py-16 lg:pt-28">
      <div class="text-center mr-auto place-self-center lg:col-span-7">
        <h1 class="mt-4 text-5xl leading-[60px] tracking-tight md:text-6xl md:leading-11 xl:text-6xl xl:leading-12 text-white font-bold" style="font-family:'Manrope';">
          {@html LOGO_TEXT}
        </h1>
        <p class="mb-9 mt-8 text-light lg:mb-8 md:text-lg lg:text-md py-2" style="font-family:'Azeret Mono'; ">{@html HERO_DESCRIPTION}<br></p>
        <a href="contribute"><button class="btn btn-primary"
          style="padding:10px 25px !important;font-size:1.15rem !important;">Contribute</button></a>
      </div>
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
    background-color: var(--main-color); /* Dark background for the card */
    border-radius: 0.5rem; /* Rounded corners */
    overflow: hidden; /* Ensure content doesn't spill out */
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); /* Add shadow */
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

