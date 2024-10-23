<script lang="ts">
  import { get } from 'svelte/store';
  import { selected_wallet_ergo, connected_wallet_address, connected_wallet_addresses } from '$lib/store/store.js';
  import WalletsModal from '$lib/components/common/WalletsModal.svelte';
  import ErgopayModal from '$lib/components/common/ErgopayModal.svelte';
  import AddressChangeModal from '$lib/components/common/AddressChangeModal.svelte';
  import Tooltip from '$lib/components/common/Tooltip.svelte'; // Import the Tooltip component
  import { connectErgoWallet, disconnectErgoWallet, KEY_ADDRESS } from '$lib/common/wallet.js';
  import { fetchConfirmedBalance } from '$lib/api-explorer/explorer.ts';
  import { nFormatter, showCustomToast, truncateAddress, isMobileDevice } from '$lib/utils/utils.js';

  let showWalletsModal = false;
  let showErgopayModal = false;
  let qrCodeText = false;
  let isAuth = false;
  let balanceInNanoErg = '0';
  let balanceErg = '0.00';
  let paymentTokenBalance = '0.00';
  let truncatedAddress = "";
  let showTooltip = false;
  let showAddressChangeModal = false;

  let selectedAddress = null;

  async function clickOnNautilusButton() {
    showWalletsModal = false;
    if ($selected_wallet_ergo) {
      await disconnectErgoWallet();
      balanceErg = '0.00';
      paymentTokenBalance = '0.00';
      truncatedAddress = "";
    } else {
      await connectErgoWallet('nautilus');
    }
  }

  async function clickOnErgopayButton() {
    showWalletsModal = false;
    if ($selected_wallet_ergo) {
      await disconnectErgoWallet();
      balanceErg = '0.00';
      paymentTokenBalance = '0.00';
      truncatedAddress = "";
    } else {
      isAuth = true;
      showErgopayModal = true;
    }
  }
  async function loadBalance(wallet) {
    if (!selected_wallet_ergo || !wallet) {
      return;
    }

    selectedAddress = $connected_wallet_address;

    const balanceData =  await fetchConfirmedBalance($connected_wallet_address);

    // Fetch balance from API
    if (!balanceData) {
      throw 'Failed to fetch balance';
    }
    
    balanceInNanoErg = balanceData.nanoErgs;
    balanceErg = (+balanceInNanoErg / 10 ** 9).toFixed(2);

    const address = $connected_wallet_address;
    truncatedAddress = address.substr(0, 6) + '...' + address.substr(address.length - 4);
  }

  $: loadBalance($selected_wallet_ergo, $connected_wallet_address);

  function toggleTooltip(e) {
    showTooltip = !showTooltip;

    if (showTooltip) {
      loadBalance($selected_wallet_ergo, $connected_wallet_address);
    }

    e.stopPropagation();
  }

  document.addEventListener('click', function(event) {
    if (showTooltip) {
      showTooltip = false;
    }
});

  window.openChangeAddressModal = function() {
    showAddressChangeModal = true;
  }

  function handleAddressChange() {
    connected_wallet_address.set(selectedAddress);
    localStorage.setItem(KEY_ADDRESS, selectedAddress);

    console.log(selectedAddress);
  }

</script>

<style>

  .wallet-button {
    position: relative;
    display: flex;
    align-items: center;
  }

  .wallet-button button {
    margin-left: 13px;
    margin-right: -2px;
  }

  .wallet-button .toggle-tooltip-button {
    padding: 5px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .wallet-button .toggle-tooltip-button svg {
    width: 24px;
    height: 24px;
  }

  .info-icon-fill {
    fill: var(--background);
  }

  .install-naut:hover {
    color: #000 !important;
  }
</style>

<div class="wallet-button gap-x-2">
  <Tooltip show={showTooltip} message={$connected_wallet_address ? `<b style="color: var(--main-color); display:inline-block; width:105px;">Connection:</b>${get(selected_wallet_ergo).charAt(0).toUpperCase() + get(selected_wallet_ergo).slice(1).toLowerCase()}\n<b style="color: var(--main-color); display:inline-block; width:105px;">Address:</b>${truncatedAddress}  <button onclick="openChangeAddressModal()" id="edit-btn" class="inline btn btn-primary ${$connected_wallet_addresses.length > 1 ? '' : 'invisible'}"><i class="fa-solid fa-pen-to-square"></i></button> \n <b style="color: var(--main-color); display:inline-block; width:105px;">ERG:</b>${nFormatter(balanceErg, 9)}`
                                      : "Connect your wallet to view details."}>
{#if $selected_wallet_ergo}
  <button class="btn btn-secondary" style="text-wrap: nowrap;" on:click={clickOnNautilusButton}>
    Disconnect  <i class="fa-solid fa-wallet"></i>
  </button>
{:else}
  <button class="btn btn-primary" style="text-wrap: nowrap;" on:click={() => (showWalletsModal = true)}>
    Connect  <i class="fa-solid fa-wallet"></i>
  </button>
{/if}
  </Tooltip>
  {#if $selected_wallet_ergo}
    <button class="toggle-tooltip-button btn btn-info" on:click={toggleTooltip}>
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path class="info-icon-fill" fill-rule="evenodd" clip-rule="evenodd" d="M12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C22 4.92893 22 7.28595 22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22ZM12 17.75C12.4142 17.75 12.75 17.4142 12.75 17V11C12.75 10.5858 12.4142 10.25 12 10.25C11.5858 10.25 11.25 10.5858 11.25 11V17C11.25 17.4142 11.5858 17.75 12 17.75ZM12 7C12.5523 7 13 7.44772 13 8C13 8.55228 12.5523 9 12 9C11.4477 9 11 8.55228 11 8C11 7.44772 11.4477 7 12 7Z"></path> </g></svg>
    </button>
  {/if}
</div>

{#if showWalletsModal}
  <WalletsModal bind:showWalletsModal>
    <div class="w-52 h-52">
      <div class="leading-6 pb-2 text-white w-100 text-center font-bold" style="font-family:'Manrope';font-size:1.5em;">Select Wallet</div>
      <div class="w-full mt-6 mb-4">
        {#if !isMobileDevice() && (!window.ergoConnector || !window.ergoConnector['nautilus'])}
          <a
            href="https://chrome.google.com/webstore/detail/nautilus-wallet/gjlmehlldlphhljhpnlddaodbjjcchai"
            target="blank_"
            style="height: 50px;text-wrap:nowrap;"
            class="w-full flex justify-center items-center btn btn-primary mb-3 install-naut"
          >
            <img style="height: 1.4em; width: 1.4em;" src="/wallets/nautilus.svg" alt="" />
            <div> Install Nautilus</div>
          </a>
        {:else if !isMobileDevice()}
          <button
            on:click={clickOnNautilusButton}
            class:grayscale={!window.ergoConnector['nautilus']}
            class="w-full flex justify-center items-center btn btn-primary mb-3"
          >

            <img style="height: 1.4em; width: 1.4em;" src="/wallets/nautilus.svg" alt="" />
            <div class="flex justify-center">
              {#if $selected_wallet_ergo == 'nautilus'}
                Disconnect
              {/if}
               Nautilus
            </div>
          </button>          
        {/if}
          <button 
           on:click={clickOnErgopayButton}
          class="w-full flex justify-center items-center btn btn-primary mb-3"
          >

            <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" aria-hidden="true" focusable="false" height="20" width="20" xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M0 0h24v24H0z"></path><path d="M16 1H8C6.34 1 5 2.34 5 4v16c0 1.66 1.34 3 3 3h8c1.66 0 3-1.34 3-3V4c0-1.66-1.34-3-3-3zm-2 20h-4v-1h4v1zm3.25-3H6.75V4h10.5v14z"></path></svg>
            <div class="flex justify-center">
              {#if $selected_wallet_ergo == 'ergopay'}
                Disconnect
              {/if}
               Ergopay
            </div>
          </button>
      </div>
    </div>
    <button slot="btn">Close</button>
  </WalletsModal>
{/if}

{#if showErgopayModal}
  <ErgopayModal bind:showErgopayModal bind:qrCodeText bind:isAuth>
    <button slot="btn">Close</button>
  </ErgopayModal>
{/if}

{#if showAddressChangeModal}
  <AddressChangeModal bind:showAddressChangeModal>
      <div class="leading-6 pb-2 text-white w-100 text-center font-bold" style="font-family:'Manrope';font-size:1.5em;">Select Address</div>
      <br>
    <div class="flex-1">
      <label class="pb-1" for="paymentToken">Selected Address:</label>
      <select id="paymentToken" class="bg-form text-white-900 text-sm rounded-lg focus-primary block w-full p-2.5" bind:value={selectedAddress}>
        {#each $connected_wallet_addresses as address}
          <option value={address} selected={address === selectedAddress}>
            {address}
          </option>
        {/each}
      </select>
    </div>
    <button on:click={handleAddressChange} slot="btn">Confirm</button>
  </AddressChangeModal>  
{/if}