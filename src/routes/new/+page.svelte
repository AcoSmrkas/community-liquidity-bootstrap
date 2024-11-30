<script lang="ts">
    import { defaultCampaignData } from '$lib/components/types/campaign.js';
    import { validateCampaignForm } from '$lib/utils/validation';
    import BaseCampaignForm from '$lib/components/forms/BaseCampaignForm.svelte';
    import CrowdfundForm from '$lib/components/forms/CrowdfundForm.svelte';
    import MintPlusLPForm from '$lib/components/forms/MintPlusLPForm.svelte';
    import MultiAssetLPForm from '$lib/components/forms/MultiAssetLPForm.svelte';
    import ERGAssetLPForm from '$lib/components/forms/ERGAssetLPForm.svelte';
    import axios from 'axios';
    import { createCampaignTx } from '$lib/contract/createCampaignTx.ts';
    import { connected_wallet_address, selected_wallet } from '$lib/store/store.ts';
    import { updateTempBoxes, fetchBoxes, getBlockHeight } from '$lib/api-explorer/explorer.ts';
    import { getCommonBoxIds, showCustomToast } from '$lib/utils/utils.js';
    import ErgopayModal from '$lib/components/common/ErgopayModal.svelte';
    import { get } from 'svelte/store';
  
    let currentStep = 1;
    const totalSteps = 2;
  
    let campaignData = { ...defaultCampaignData };
    let validationErrors = [];
    let isSubmitting = false;
    let submitSuccess = false;
    let submitError = '';

    let showErgopayModal = false;
    let isAuth = false;
    let unsignedTx = null;
  
    $: {
      if (campaignData.campaign_type === 'crowdfund') {
        campaignData.token_name = "";
        campaignData.token_description = "";
        campaignData.total_supply = 0;
        campaignData.secondary_token_id = null;
        campaignData.secondary_token_name = "";
      }
    }
  
    async function handleSubmit() {
      validationErrors = validateCampaignForm(campaignData);
  
      if (validationErrors.length === 0) {
        isSubmitting = true;
  
        const selectedWalletErgo = get(selected_wallet);

        try {
          let myAddress, height, utxos;

          if (selectedWalletErgo === 'ergopay') {
              myAddress = get(connected_wallet_address);
              utxos = await fetchBoxes(myAddress);
              height = await getBlockHeight();
          } else {
              myAddress = await ergo.get_change_address();
              utxos = await fetchBoxes($connected_wallet_address);
              height = await ergo.get_current_height();
          }

          const unsigned = await createCampaignTx(
              myAddress, utxos, height
          );

          if (selectedWalletErgo === 'ergopay') {
              unsignedTx = unsigned;
              isAuth = false;
              showErgopayModal = true;
              return null;
          }

          const signed = await ergo.sign_tx(unsigned);
          const txId = await ergo.submit_tx(signed);

          if (txId) {
            const usedBoxIds = getCommonBoxIds(utxos, signed.inputs);
            const newOutputs = signed.outputs.filter(output => output.ergoTree === utxos[0].ergoTree);
            updateTempBoxes(myAddress, usedBoxIds, newOutputs);
            insertCampaign(txId);
          }
        } catch (e) {
          handleTransactionError(e);
        }
      }
    }

    function handleTransactionError(e) {
        if (e.message?.includes('Insufficient')) {
            showCustomToast(`Insufficient funds.`, 5000, 'danger');
        } else if (e.info === 'User rejected' || (e.cause?.failure?.cause?.code === 2)) {
            // Handle user rejection silently
        } else {
            showCustomToast(`Failed to submit TX.`, 5000, 'danger');
        }

        isSubmitting = false;
    }

    let onTxSubmitted = function (txId) {
      if (txId) {
        insertCampaign(txId);
      }
    }

    async function insertCampaign(txId) {
      try {
        campaignData.txid = txId;

        const response = await axios.post('https://api.mewfinance.com/mew/fund/insertCampaign', campaignData, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        submitSuccess = true;
        window.location.href = '/contribute';
      } catch (error) {
        submitError = 'Error submitting campaign data. Please try again later.';
        console.error('Error submitting campaign data:', error);
      } finally {
        isSubmitting = false;
      }
    }
  </script>
  
  <div class="container mx-auto px-4 py-8" style="margin-top: 45px;">
    <div class="max-w-3xl mx-auto">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-[var(--main-color)] mb-2">Create New Campaign</h1>
        <p class="text-[var(--text-secondary)]">Launch your project on the Ergo blockchain.</p>
      </div>
  
      <div class="bg-[var(--forms-bg)] rounded-xl p-6 border border-[var(--border-color)]">
        {#if currentStep === 1}
          <BaseCampaignForm bind:data={campaignData} />
        {:else if currentStep === 2}
          {#if campaignData.campaign_type === 'crowdfund'}
            <CrowdfundForm bind:data={campaignData} />
          {:else if campaignData.campaign_type === 'mintpluslp'}
            <MintPlusLPForm bind:data={campaignData} />
          {:else if campaignData.campaign_type === 'multiassetlp'}
            <MultiAssetLPForm bind:data={campaignData} />
          {:else if campaignData.campaign_type === 'ergassetlp'}
            <ERGAssetLPForm bind:data={campaignData} />
          {/if}
        {/if}

        {#if currentStep === totalSteps}
        <div class="flex justify-between mt-8">
          <p>Campaign creation fee: <b class="text-white">10</b> <span class="font-bold text-primary">ERG</span></p>
          </div>
        {/if}
  
        <div class="flex justify-between mt-8">
          <button
            class="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            on:click={() => currentStep--}
            disabled={currentStep === 1}
          >
            Previous
          </button>
  
          {#if currentStep === totalSteps}
            <button
              class="btn btn-primary"
              on:click={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Create Campaign'}
            </button>
          {:else}
            <button
              class="btn btn-primary"
              on:click={() => currentStep++}
            >
              Next
            </button>
          {/if}
        </div>
  
        {#if validationErrors.length > 0}
          <div class="mt-6 bg-[var(--card-bg)] border border-red-500 rounded-lg p-4">
            <h4 class="text-red-400 font-medium mb-2">Please check the following:</h4>
            <ul class="space-y-1 text-sm text-red-400">
              {#each validationErrors as error}
                <li>• {error}</li>
              {/each}
            </ul>
          </div>
        {/if}
  
        {#if submitSuccess}
          <div class="mt-6 bg-[var(--card-bg)] border border-green-500 rounded-lg p-4">
            <h4 class="text-green-400 font-medium mb-2">Campaign submitted successfully!</h4>
          </div>
        {:else if submitError}
          <div class="mt-6 bg-[var(--card-bg)] border border-red-500 rounded-lg p-4">
            <h4 class="text-red-400 font-medium mb-2">Error submitting campaign:</h4>
            <p class="text-sm text-red-400">{submitError}</p>
          </div>
        {/if}
  
        <!-- Step indicator -->
        <div class="mt-6 flex justify-center gap-2">
          {#each Array(totalSteps) as _, i}
            <div 
              class="w-2 h-2 rounded-full transition-colors duration-200
                     {currentStep === i + 1 
                         ? 'bg-[var(--main-color)]' 
                         : 'bg-[var(--border-color)]'}"
            />
          {/each}
        </div>
      </div>
    </div>
  </div>

  {#if showErgopayModal}
    <ErgopayModal 
        bind:showErgopayModal 
        bind:isAuth
        bind:unsignedTx
        bind:onTxSubmitted
    >
        <button slot="btn">Close</button>
    </ErgopayModal>
{/if}
  
  <style>
    :global(body) {
      background-color: var(--card-bg);
    }
  </style>