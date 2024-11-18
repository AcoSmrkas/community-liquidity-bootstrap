<script>
    import { onMount } from 'svelte';
    import { sendErgoTx } from "$lib/contract/sendErgoTx.ts";
    import { Globe, MessageCircle, Twitter, MessagesSquare } from 'lucide-svelte';
    import { sendCardanoTx } from "$lib/contract/sendCardanoTx.ts";
    import ErgopayModal from '$lib/components/common/ErgopayModal.svelte';
    import ContributeModal from './ContributeModal.svelte';
    import { selected_wallet, connected_wallet_address } from "$lib/store/store.ts";
    import { fetchBoxes, getBlockHeight, updateTempBoxes } from '$lib/api-explorer/explorer.ts';  
    import { get } from "svelte/store";
    import { showCustomToast, isWalletConected, getCommonBoxIds, calculateTimeLeft, nFormatter } from '$lib/utils/utils.js';
    import { isWalletErgo, isWalletCardano } from '$lib/common/wallet.ts';
    import { API_HOST, MEW_FEE_PERCENTAGE } from '$lib/common/const.js';
    import axios from "axios";
    import { BigNumber } from 'bignumber.js';

    // Component state
    let showErgopayModal = false;
    let showContributeModal = false;
    let selectedCampaign = null;
    let isAuth = false;
    let unsignedTx = null;
    let activeTab = 'ergo';
    let campaigns = [];
    let campaignBalances = {};
    let loading = false;
    
    // Campaign data management
    async function fetchCampaigns() {
        try {
            const response = await axios.get(`${API_HOST}/mew/fund/getCampaigns`);
            if (!response.data.items) return;

            campaigns = response.data.items.map(campaign => ({
                ...campaign,
                network: campaign.base_name === 'ERG' ? 'ergo' : 'cardano'
            }));
            await updateBalances();
        } catch (error) {
            showCustomToast('Failed to fetch campaigns', 5000, 'danger');
        }
    }

    async function updateBalances() {
        const newBalances = {};
        for (const campaign of campaigns) {
            try {
                let balance = 0;
                let percentage = 0;

                if (campaign.base_name === 'ERG') {
                    const response = await axios.get(`https://api.ergoplatform.com/api/v1/addresses/${campaign.recipient_address}/balance/total`);
                    balance = response.data.confirmed.nanoErgs / Math.pow(10, 9);
                    percentage = Math.min((balance / parseFloat(campaign.base_target_amount)) * 100, 100);
                } else {
                    // Fetch token balance for non-ERG campaigns
                    const response = await axios.get(`https://api.ergoplatform.com/api/v1/addresses/${campaign.recipient_address}/balance/total`);
                    const token = response.data.confirmed.tokens.find(t => t.tokenId === campaign.base_token_id);
                    balance = token ? token.amount / Math.pow(10, token.decimals) : 0;
                    percentage = Math.min((balance / parseFloat(campaign.base_target_amount)) * 100, 100);
                }

                newBalances[campaign.id] = {
                    baseToken: {
                        current: balance,
                        percentage
                    },
                    projectToken: {
                        current: 0,
                        percentage: 0
                    }
                };
            } catch (error) {
                continue;
            }
        }
        campaignBalances = newBalances;
    }

    function getCampaignStatus(campaign) {
        if (campaign.status_phase) return campaign.status_phase;

        const now = new Date().getTime();
        const endDate = new Date(campaign.end_date).getTime();
        
        if (now > endDate) return 'ended';
        
        const baseBalance = campaignBalances[campaign.id]?.baseToken?.current || 0;
        const baseTarget = parseFloat(campaign.base_target_amount) || 0;
        
        if (baseBalance >= baseTarget) return 'ended';
        
        return 'active';
    }

    async function handleErgoContribution(amount, selectedAsset) {
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

        const tokenId = selectedAsset.name === 'ERG' ? null : selectedAsset.tokenId;

        const unsigned = await sendErgoTx(
            myAddress,
            utxos,
            selectedAsset.name,
            amount,
            height,
            selectedCampaign.id,
            tokenId,
            selectedCampaign.recipient_address,
            selectedAsset.decimals
        );

        if (selectedWalletErgo === 'ergopay') {
            unsignedTx = unsigned;
            isAuth = false;
            showErgopayModal = true;
            showContributeModal = false; // Close contribute modal first
            return null;
        } else {
            const signed = await ergo.sign_tx(unsigned);
            const txId = await ergo.submit_tx(signed);

            if (txId) {
                const usedBoxIds = getCommonBoxIds(utxos, signed.inputs);
                const newOutputs = signed.outputs.filter(output => output.ergoTree === utxos[0].ergoTree);
                updateTempBoxes(myAddress, usedBoxIds, newOutputs);
                return txId;
            }
        }
    } catch (e) {
        handleTransactionError(e);
        return null;
    }
}

    async function handleCardanoContribution(amount, selectedAsset) {
        const selectedWalletCardano = get(selected_wallet);

        try {
            const walletApi = await window.cardano[selectedWalletCardano].enable();
            if (!walletApi) throw new Error("Failed to enable wallet");

            return await sendCardanoTx(
                walletApi,
                selectedAsset.name,
                amount,
                selectedCampaign.id,
                selectedAsset.tokenId,
                selectedAsset.name,
                selectedCampaign.recipient_address,
                selectedAsset.decimals
            );
        } catch (e) {
            handleTransactionError(e);
            return null;
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
    }
    async function handleContribution(event) {
    const { amount, selectedAsset } = event.detail;
    if (loading || !amount || !selectedAsset) return;
    
    loading = true;
    try {
        const network = activeTab;
        let txId;

        // Calculate the actual contribution and fee from the total amount
        const totalAmount = new BigNumber(amount);
        const feePercentage = new BigNumber(MEW_FEE_PERCENTAGE).dividedBy(100);
        const campaignAmount = totalAmount.dividedBy(new BigNumber(1).plus(feePercentage));
        const feeAmount = totalAmount.minus(campaignAmount);

        if (network === 'ergo') {
            const selectedWalletErgo = get(selected_wallet);
            if (!isWalletErgo(selectedWalletErgo) || !isWalletConected()) {
                showCustomToast('Please connect an Ergo wallet first.', 1500, 'info');
                loading = false;
                return;
            }
            txId = await handleErgoContribution(amount, selectedAsset);
        } else {
            const selectedWalletCardano = get(selected_wallet);
            if (!isWalletCardano(selectedWalletCardano) || !isWalletConected()) {
                showCustomToast('Please connect a Cardano wallet first.', 1500, 'info');
                loading = false;
                return;
            }
            txId = await handleCardanoContribution(amount, selectedAsset);
        }

        if (txId) {
            showCustomToast(
                `Transaction submitted successfully.<br>TX ID: <a target="_new" href="${
                    network === 'ergo' 
                        ? 'https://ergexplorer.com/transactions/' 
                        : 'https://cardanoscan.io/transaction/'
                }${txId}">${txId}</a>`, 
                5000, 
                'success'
            );
            
            showCustomToast(`
                Contribution breakdown:<br>
                Total Amount: ${totalAmount.toFixed(4)} ${selectedAsset.name}<br>
                To Campaign: ${campaignAmount.toFixed(4)} ${selectedAsset.name} (100%)<br>
                Platform Fee: ${feeAmount.toFixed(4)} ${selectedAsset.name} (${MEW_FEE_PERCENTAGE}%)
            `, 8000, 'info');

            onContributeModalClose();
            await updateBalances();
        }
    } catch (error) {
        showCustomToast('Failed to process contribution. Please try again.', 5000, 'danger');
    } finally {
        loading = false;
    }
}
    // UI helpers
    function onContributeModalClose() {
        showContributeModal = false;
        selectedCampaign = null;
    }
// Also make sure this event handler is present:
function handleTxSubmitted(event) {
    const txId = event.detail;
    if (txId) {
        showCustomToast(
            `Transaction submitted successfully.<br>TX ID: <a target="_new" href="https://ergexplorer.com/transactions/${txId}">${txId}</a>`, 
            5000, 
            'success'
        );
        
        if (selectedCampaign) {
            const feeAmount = new BigNumber(amount).multipliedBy(MEW_FEE_PERCENTAGE).dividedBy(100);
            const campaignAmount = new BigNumber(amount).minus(feeAmount);
            
            showCustomToast(`
                Contribution breakdown:<br>
                To Campaign: ${campaignAmount.toFixed(4)} ${selectedCampaign.base_name}<br>
                Platform Fee (${MEW_FEE_PERCENTAGE}%): ${feeAmount.toFixed(4)} ${selectedCampaign.base_name}
            `, 8000, 'info');
            
            updateBalances();
        }
    }
}
    // Lifecycle
    onMount(() => {
        fetchCampaigns();
        const interval = setInterval(updateBalances, 300000);
        return () => clearInterval(interval);
    });
</script>
<div class="container top-margin text-white mb-5">
    <div class="container mx-auto px-0 max-w-6xl">
        <h1 class="text-4xl font-bold text-white text-center mb-8">Contribute</h1>

        <!-- Network Tabs -->
        <div class="flex justify-center space-x-4 mb-[50px]">
            <button
                class="px-8 py-2 rounded-lg font-medium transition-colors text-bg duration-200"
                class:active-tab={activeTab === 'ergo'}
                class:inactive-tab={activeTab !== 'ergo'}
                on:click={() => activeTab = 'ergo'}
            >
                Ergo Campaigns
            </button>
            <button
                class="px-8 py-2 rounded-lg font-medium text-bg duration-200"
                class:active-tab={activeTab === 'cardano'}
                class:inactive-tab={activeTab !== 'cardano'}
                on:click={() => activeTab = 'cardano'}
            >
                Cardano Campaigns
            </button>
        </div>

        <!-- Token Minting Campaigns -->
        <div class="mt-12">
            <h2 class="text-2xl font-bold mb-4">Campaigns Minting New Tokens</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-12">
                {#each campaigns.filter(c => c.network === activeTab && c.mint_new_token === true) as campaign (campaign.id)}
                    <div 
                        class="campaign-card relative rounded-xl p-6 hover:shadow-lg transition-all overflow-hidden"
                        class:opacity-75={getCampaignStatus(campaign) === 'ended'}
                    >
                        <!-- Header -->
                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <h3 class="text-xl font-bold text-primary mb-2">{campaign.title}</h3>
                                <p class="text-gray-400 text-sm">{campaign.description}</p>
                            </div>
                            <div class="mt-[3px] px-3 py-1 rounded-full text-xs capitalize" 
                                class:bg-green-500={campaign.status_phase === 'active'}
                                class:bg-yellow-500={campaign.status_phase === 'upcoming'}
                                class:bg-red-500={campaign.status_phase === 'ended'}>
                                {campaign.status_phase}
                            </div>
                        </div>

                        <!-- Progress Section -->
                        <div class="mb-6">
                            <div class="flex justify-between items-center mb-2">
                                <div class="text-gray-400 text-sm">Progress</div>
                                <div class="text-white text-sm font-medium">
                                    {(campaignBalances[campaign.id]?.baseToken?.percentage || 0).toFixed(2)}%
                                </div>
                            </div>
                            <div class="w-full bg-gray-700 rounded-full h-2 mb-2">
                                <div 
                                    class="bg-cyan-500 rounded-full h-2 transition-all duration-500" 
                                    style="width: {campaignBalances[campaign.id]?.baseToken?.percentage || 0}%"
                                />
                            </div>
                            <div class="flex justify-between text-sm">
                                <div class="text-gray-400">
                                    Raised: {(campaignBalances[campaign.id]?.baseToken?.current || 0).toLocaleString()} {campaign.base_name}
                                </div>
                                <div class="text-gray-400">
                                    Target: {campaign.target_raise.toLocaleString()} {campaign.base_name}
                                </div>
                            </div>
                        </div>
<!-- Contribution Limits -->
<div class="flex justify-between mb-6 text-sm">
    <div>
        <div class="text-gray-400 mb-1">Supply</div>
        <div class="text-white">   {#if campaign.total_supply}
            <div class="text-gray-400 mt-2"> {campaign.total_supply}</div>
        {/if}</div>
    </div>
</div>
                        <!-- Contribution Limits -->
                        <div class="flex justify-between mb-6 text-sm">
                            {#if campaign.initial_price}  <div>
                                <div class="text-gray-400 mb-1">Initial Price:</div>
                                <div class="text-white">{campaign.initial_price}</div>
                            </div> {/if}
                            <div>
                                <div class="text-gray-400 mb-1">Min Contribution</div>
                                <div class="text-white">{nFormatter(campaign.min_contribution)} {campaign.base_name}</div>
                            </div>
                            <div>
                                <div class="text-gray-400 mb-1">Max Contribution</div>
                                <div class="text-white">{nFormatter(campaign.max_contribution)} {campaign.base_name}</div>
                            </div>
                            <div>
                                <div class="text-gray-400 mb-1">Platform Fee</div>
                                <div class="text-white">{MEW_FEE_PERCENTAGE}%</div>
                            </div>
                          
                        </div>

                     

                 <!-- Social Links -->
{#if campaign.website || campaign.telegram || campaign.twitter || campaign.discord}
<div class="mt-3 flex space-x-4 mb-3 justify-evenly">
    {#if campaign.website}
        <a
            href={campaign.website}
            target="_blank"
            rel="noopener noreferrer"
            class="text-gray-400 hover:text-cyan-500 transition-colors"
            title="Website"
        >
            <Globe size={20} />
        </a>
    {/if}
    {#if campaign.telegram}
        <a
            href={campaign.telegram}
            target="_blank"
            rel="noopener noreferrer"
            class="text-gray-400 hover:text-cyan-500 transition-colors"
            title="Telegram"
        >
            <MessageCircle size={20} />
        </a>
    {/if}
    {#if campaign.twitter}
        <a
            href={campaign.twitter}
            target="_blank"
            rel="noopener noreferrer"
            class="text-gray-400 hover:text-cyan-500 transition-colors"
            title="Twitter"
        >
            <Twitter size={20} />
        </a>
    {/if}
    {#if campaign.discord}
        <a
            href={campaign.discord}
            target="_blank"
            rel="noopener noreferrer"
            class="text-gray-400 hover:text-cyan-500 transition-colors"
            title="Discord"
        >
            <MessagesSquare size={20} />
        </a>
    {/if}
</div>
{/if}

                        <!-- Action Button -->
                        <button
                            class="w-full py-3 px-4 btn btn-primary text-black font-medium rounded-lg 
                                   transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            on:click={() => {
                                if (getCampaignStatus(campaign) === 'active') {
                                    selectedCampaign = campaign;
                                    showContributeModal = true;
                                }
                            }}
                            disabled={getCampaignStatus(campaign) !== 'active'}
                        >
                            {#if getCampaignStatus(campaign) === 'active'}
                                Contribute
                            {:else if getCampaignStatus(campaign) === 'upcoming'}
                                Coming Soon
                            {:else}
                                Campaign Ended
                            {/if}
                        </button>
                    </div>
                {/each}
            </div>

            <!-- LP Creation Campaigns -->
            <h2 class="text-2xl font-bold mb-4">Campaigns Creating LP with Provided Assets</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {#each campaigns.filter(c => c.network === activeTab && c.mint_new_token === false) as campaign (campaign.id)}
                    <div 
                        class="campaign-card relative rounded-xl p-6 hover:shadow-lg transition-all overflow-hidden"
                        class:opacity-75={getCampaignStatus(campaign) === 'ended'}
                    >
                        <!-- Header -->
                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <h3 class="text-xl font-bold text-primary mb-2">{campaign.title}</h3>
                                <p class="text-gray-400 text-sm">{campaign.description}</p>
                            </div>
                            <div class="mt-[3px] px-3 py-1 rounded-full text-xs capitalize" 
                                class:bg-green-500={campaign.status_phase === 'active'}
                                class:bg-yellow-500={campaign.status_phase === 'upcoming'}
                                class:bg-red-500={campaign.status_phase === 'ended'}>
                                {campaign.status_phase}
                            </div>
                        </div>

                        <!-- Progress Section -->
                        <div class="mb-6">
                            <div class="flex justify-between items-center mb-2">
                                <div class="text-gray-400 text-sm">Progress</div>
                                <div class="text-white text-sm font-medium">
                                    {(campaignBalances[campaign.id]?.baseToken?.percentage || 0).toFixed(2)}%
                                </div>
                            </div>
                            <div class="w-full bg-gray-700 rounded-full h-2 mb-2">
                                <div 
                                    class="bg-cyan-500 rounded-full h-2 transition-all duration-500" 
                                    style="width: {campaignBalances[campaign.id]?.baseToken?.percentage || 0}%"
                                />
                            </div>
                            <div class="flex justify-between text-sm">
                                <div class="text-gray-400">
                                    Raised: {(campaignBalances[campaign.id]?.baseToken?.current || 0).toLocaleString()} {campaign.base_name}
                                </div>
                                <div class="text-gray-400">
                                    Target: {campaign.base_target_amount.toLocaleString()} {campaign.base_name}
                                </div>
                            </div>
                        </div>

                        <!-- Contribution Limits -->
                        <div class="flex justify-between mb-6 text-sm">
                            <div>
                                <div class="text-gray-400 mb-1">Min Contribution</div>
                                <div class="text-white">{nFormatter(campaign.min_contribution)} {campaign.base_name}</div>
                            </div>
                            <div>
                                <div class="text-gray-400 mb-1">Max Contribution</div>
                                <div class="text-white">{nFormatter(campaign.max_contribution)} {campaign.base_name}</div>
                            </div>
                            <div>
                                <div class="text-gray-400 mb-1">Platform Fee</div>
                                <div class="text-white">{MEW_FEE_PERCENTAGE}%</div>
                            </div>
                        </div>

                     
<!-- Social Links -->
{#if campaign.website || campaign.telegram || campaign.twitter || campaign.discord}
    <div class="mt-3 flex space-x-4 mb-3 justify-evenly">
        {#if campaign.website}
            <a
                href={campaign.website}
                target="_blank"
                rel="noopener noreferrer"
                class="text-gray-400 hover:text-cyan-500 transition-colors"
                title="Website"
            >
                <Globe size={20} />
            </a>
        {/if}
        {#if campaign.telegram}
            <a
                href={campaign.telegram}
                target="_blank"
                rel="noopener noreferrer"
                class="text-gray-400 hover:text-cyan-500 transition-colors"
                title="Telegram"
            >
                <MessageCircle size={20} />
            </a>
        {/if}
        {#if campaign.twitter}
            <a
                href={campaign.twitter}
                target="_blank"
                rel="noopener noreferrer"
                class="text-gray-400 hover:text-cyan-500 transition-colors"
                title="Twitter"
            >
                <Twitter size={20} />
            </a>
        {/if}
        {#if campaign.discord}
            <a
                href={campaign.discord}
                target="_blank"
                rel="noopener noreferrer"
                class="text-gray-400 hover:text-cyan-500 transition-colors"
                title="Discord"
            >
                <MessagesSquare size={20} />
            </a>
        {/if}
    </div>
{/if}

                        <!-- Action Button -->
                        <button
                            class="w-full py-3 px-4 btn btn-primary text-black font-medium rounded-lg 
                                   transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            on:click={() => {
                                if (getCampaignStatus(campaign) === 'active') {
                                    selectedCampaign = campaign;
                                    showContributeModal = true;
                                }
                            }}
                            disabled={getCampaignStatus(campaign) !== 'active'}
                        >
                            {#if getCampaignStatus(campaign) === 'active'}
                                Contribute
                            {:else if getCampaignStatus(campaign) === 'upcoming'}
                                Coming Soon
                            {:else}
                                Campaign Ended
                            {/if}
                        </button>
                    </div>
                {/each}
            </div>
        </div>
    </div>
</div>

<!-- Modals -->
{#if showContributeModal}
    <ContributeModal 
        campaign={selectedCampaign}
        onClose={onContributeModalClose}
        bind:showErgopayModal
        bind:isAuth
        bind:unsignedTx
        on:contribute={handleContribution}
        {loading}
        {campaignBalances}
    />
{/if}

{#if showErgopayModal}
    <ErgopayModal 
        bind:showErgopayModal 
        bind:isAuth
        bind:unsignedTx
        on:txSubmitted={handleTxSubmitted}
    >
        <button slot="btn">Close</button>
    </ErgopayModal>
{/if}

<style>
    .campaign-card {
        background-color: var(--forms-bg);
    }

    .active-tab {
        background-color: var(--main-color);
        color: white;
    }

    .inactive-tab {
        background-color: var(--forms-bg);
        color: rgb(209 213 219) !important;
    }

    .inactive-tab:hover {
        background-color: var(--main-color);
        color: var(--background) !important;
    }

    :global(.campaign-card) {
        background-color: var(--forms-bg);
    }

    .bg-green-500 {
        background-color: rgb(34 197 94);
    }

    .bg-yellow-500 {
        background-color: rgb(234 179 8);
    }

    .bg-red-500 {
        background-color: rgb(239 68 68);
    }

    .bg-cyan-500 {
        background-color: rgb(6 182 212);
    }

    .hover\:bg-cyan-600:hover {
        background-color: rgb(8 145 178);
    }

    .text-cyan-500 {
        color: rgb(6 182 212);
    }

    button:disabled {
        cursor: not-allowed;
    }
</style>