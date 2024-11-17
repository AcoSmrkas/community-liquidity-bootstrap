<script lang="ts">
    import { sendErgoTx } from "$lib/contract/sendErgoTx.ts";
    import { sendCardanoTx } from "$lib/contract/sendCardanoTx.ts";
    import ErgopayModal from '$lib/components/common/ErgopayModal.svelte';
    import ContributeModal from './ContributeModal.svelte';
    import { selected_wallet, connected_wallet_address } from "$lib/store/store.ts";
    import { fetchBoxes, getBlockHeight, updateTempBoxes } from '$lib/api-explorer/explorer.ts';  
    import { get } from "svelte/store";
    import { showCustomToast, isWalletConected, getCommonBoxIds, calculateTimeLeft } from '$lib/utils/utils.js';
    import { isWalletErgo, isWalletCardano } from '$lib/common/wallet.ts';
    import { API_HOST, FUNDING_CAMPAIGNS, MEW_FEE_PERCENTAGE } from '$lib/common/const.js';
    import axios from "axios";
    import { onMount } from 'svelte';
    import { BigNumber } from 'bignumber.js';

    // Component state variables
    let showErgopayModal = false;
    let showContributeModal = false;
    let selectedCampaign = null;
    let isAuth = false;
    let unsignedTx = null;
    let campaignBalances = {};
    let loading = false;
    let activeTab = 'ergo';
    let amount = '';

    // Campaign status handler
    function getCampaignStatus(campaign) {
        const now = new Date().getTime();
        const endDate = new Date(campaign.endDate).getTime();
        
        if (now > endDate) return 'ended';
        
        const baseBalance = campaignBalances[campaign.id]?.baseToken?.current || 0;
        if (baseBalance >= campaign.assets.base.targetAmount) return 'ended';
        
        return campaign.status.phase;
    }

    // Balance fetching functions
    async function fetchErgoBalance(address, campaign) {
        try {
            const response = await fetch(`https://api.ergoplatform.com/api/v1/addresses/${address}/balance/total`);
            const data = await response.json();
            
            const balances = {
                baseToken: {
                    current: 0,
                    percentage: 0
                },
                projectToken: {
                    current: 0,
                    percentage: 0
                }
            };

            // Handle ERG balance
            if (data.confirmed.nanoErgs) {
                const ergAmount = new BigNumber(data.confirmed.nanoErgs)
                    .dividedBy(Math.pow(10, campaign.assets.base.decimals))
                    .toNumber();
                balances.baseToken.current = ergAmount;
                balances.baseToken.percentage = (ergAmount / campaign.assets.base.targetAmount) * 100;
            }

            // Handle project token balance
            if (data.confirmed.tokens) {
                const projectToken = data.confirmed.tokens.find(
                    token => token.tokenId === campaign.assets.token.tokenId
                );
                if (projectToken) {
                    const tokenAmount = new BigNumber(projectToken.amount)
                        .dividedBy(Math.pow(10, campaign.assets.token.decimals))
                        .toNumber();
                    balances.projectToken.current = tokenAmount;
                    balances.projectToken.percentage = (tokenAmount / campaign.assets.token.targetAmount) * 100;
                }
            }

            return balances;
        } catch (e) {
            console.error('Error fetching Ergo balance:', e);
            return null;
        }
    }

    async function fetchCardanoBalance(address, campaign) {
        try {
            const response = await fetch(
                `https://cardano-mainnet.blockfrost.io/api/v0/addresses/${address}`,
                {
                    headers: {
                        'project_id': BLOCKFROST_PROJECT_ID
                    }
                }
            );
            const data = await response.json();
            
            const balances = {
                baseToken: {
                    current: 0,
                    percentage: 0
                },
                projectToken: {
                    current: 0,
                    percentage: 0
                }
            };

            // Handle ADA balance
            if (data.amount) {
                const lovelaceEntry = data.amount.find(entry => entry.unit === 'lovelace');
                if (lovelaceEntry) {
                    const adaAmount = new BigNumber(lovelaceEntry.quantity)
                        .dividedBy(Math.pow(10, campaign.assets.base.decimals))
                        .toNumber();
                    balances.baseToken.current = adaAmount;
                    balances.baseToken.percentage = (adaAmount / campaign.assets.base.targetAmount) * 100;
                }
            }

            // Handle project token balance
            if (data.amount) {
                const projectTokenUnit = campaign.assets.token.policyId + 
                    Buffer.from(campaign.assets.token.assetName).toString('hex');
                const tokenEntry = data.amount.find(entry => entry.unit === projectTokenUnit);
                if (tokenEntry) {
                    const tokenAmount = new BigNumber(tokenEntry.quantity)
                        .dividedBy(Math.pow(10, campaign.assets.token.decimals))
                        .toNumber();
                    balances.projectToken.current = tokenAmount;
                    balances.projectToken.percentage = (tokenAmount / campaign.assets.token.targetAmount) * 100;
                }
            }

            return balances;
        } catch (e) {
            console.error('Error fetching Cardano balance:', e);
            return null;
        }
    }

    // Balance update function
    async function updateBalances() {
        for (const network of Object.keys(FUNDING_CAMPAIGNS)) {
            for (const campaign of FUNDING_CAMPAIGNS[network]) {
                const balance = await (network === 'ergo' 
                    ? fetchErgoBalance(campaign.recipientAddress, campaign)
                    : fetchCardanoBalance(campaign.recipientAddress, campaign));
                
                if (balance) {
                    campaignBalances[campaign.id] = balance;
                }
            }
        }
    }

    // Transaction handling functions
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

            const unsigned = await sendErgoTx(
                myAddress,
                utxos,
                selectedAsset.name,
                amount,
                height,
                selectedCampaign.id,
                selectedAsset.tokenId,
                selectedCampaign.recipientAddress,
                selectedAsset.decimals
            );

            if (selectedWalletErgo === 'ergopay') {
                unsignedTx = unsigned;
                isAuth = false;
                showErgopayModal = true;
                onContributeModalClose();
                return null;
            } else {
                const signed = await ergo.sign_tx(unsigned);
                const txId = await ergo.submit_tx(signed);

                if (txId) {
                    const usedBoxIds = getCommonBoxIds(utxos, signed.inputs);
                    const newOutputs = signed.outputs.filter(output => output.ergoTree == utxos[0].ergoTree);
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
        // Get the wallet API
        const walletApi = await window.cardano[selectedWalletCardano].enable();
        
        if (!walletApi) {
            throw new Error("Failed to enable wallet");
        }

        const txHash = await sendCardanoTx(
            walletApi,
            selectedAsset.name,
            amount,
            selectedCampaign.id,
            selectedAsset.policyId,
            selectedAsset.assetName,
            selectedCampaign.recipientAddress,
            selectedAsset.decimals
        );

        return txHash;
    } catch (e) {
        handleTransactionError(e);
        return null;
    }
}


    function handleTransactionError(e) {
        console.error(e);
        if (e.message?.includes('Insufficient')) {
            showCustomToast(`Insufficient funds.`, 5000, 'danger');
        } else if (e.info === 'User rejected' || (e.cause?.failure?.cause?.code === 2)) {
            // Handle user rejection silently
        } else {
            showCustomToast(`Failed to submit TX.`, 5000, 'danger');
        }
    }

    // Contribution handling
    async function handleContribution(event) {
        const { amount, selectedAsset } = event.detail;
        if (loading || !amount || !selectedAsset) return;
        
        loading = true;
        try {
            const network = activeTab;
            let txId;

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
                
                const feeAmount = new BigNumber(amount).multipliedBy(MEW_FEE_PERCENTAGE).dividedBy(100);
                const campaignAmount = new BigNumber(amount).minus(feeAmount);
                
                showCustomToast(`
                    Contribution breakdown:<br>
                    To Campaign: ${campaignAmount.toFixed(4)} ${selectedAsset.name}<br>
                    Platform Fee (${MEW_FEE_PERCENTAGE}%): ${feeAmount.toFixed(4)} ${selectedAsset.name}
                `, 8000, 'info');

                await logContribution(network, selectedAsset.name, amount, txId);
                onContributeModalClose();
                await updateBalances();
            }
        } catch (error) {
            console.error('Contribution error:', error);
            showCustomToast('Failed to process contribution. Please try again.', 5000, 'danger');
        } finally {
            loading = false;
        }
    }

    // Contribution logging
    async function logContribution(network, asset, amount, txid) {
        try {
            await axios.post(`${API_HOST}/clb/logContribution`, {
                network,
                asset,
                amount,
                address: $connected_wallet_address,
                txid,
                campaignId: selectedCampaign.id
            });
        } catch (e) {
            console.error('Error logging contribution:', e);
        }
    }

    function onContributeModalClose() {
        showContributeModal = false;
        selectedCampaign = null;
    }

    function handleTxSubmitted(event) {
        const txId = event.detail;
        if (txId && selectedCampaign) {
            logContribution(activeTab, selectedCampaign.assets.base.name, amount, txId);
        }
    }

    // Initialize component
    onMount(() => {
        updateBalances();
        const interval = setInterval(updateBalances, 300000); // Update every 5 minutes
        return () => clearInterval(interval);
    });
</script>
<div class="container mx-auto px-4 py-8 text-white">
    <h1 class="text-4xl font-bold text-center mb-8">Contribute</h1>

    <!-- Network Tabs -->
    <div class="flex justify-center space-x-4 mb-8">
        <button
            class="px-8 py-2 rounded-lg font-medium transition-colors text-black duration-200"
            class:active-tab={activeTab === 'ergo'}
            class:inactive-tab={activeTab !== 'ergo'}
            on:click={() => activeTab = 'ergo'}
        >
            Ergo Campaigns
        </button>
        <button
            class="px-8 py-2 rounded-lg font-medium text-black duration-200"
            class:active-tab={activeTab === 'cardano'}
            class:inactive-tab={activeTab !== 'cardano'}
            on:click={() => activeTab = 'cardano'}
        >
            Cardano Campaigns
        </button>
    </div>

    <!-- Campaign Type Sections -->
    {#each ['Campaigns Minting New Tokens', 'Campaigns Creating LP with Provided Assets'] as sectionTitle, index}
        <div class="mt-8">
            <h2 class="text-2xl font-bold mb-4">{sectionTitle}</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {#each FUNDING_CAMPAIGNS[activeTab].filter(c => c.mintNewToken === (index === 0)) as campaign (campaign.id)}
                    <div 
                        class="campaign-card relative rounded-xl p-6 hover:shadow-lg transition-all 
                               border border-gray-800 hover:border-cyan-500/50"
                        class:opacity-75={getCampaignStatus(campaign) === 'ended'}
                    >
                        <!-- Header -->
                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <h3 class="text-xl font-bold text-white mb-2">{campaign.title}</h3>
                                <p class="text-gray-400 text-sm">{campaign.description}</p>
                            </div>
                            <div class="px-3 py-1 rounded-full text-xs" 
                                 class:bg-green-500={campaign.status.phase === 'active'}
                                 class:bg-yellow-500={campaign.status.phase === 'upcoming'}
                                 class:bg-red-500={campaign.status.phase === 'ended'}>
                                {campaign.status.phase}
                            </div>
                        </div>

                        <!-- Token Info Grid -->
                        {#if campaign.mintNewToken}
                            <div class="grid grid-cols-2 gap-4 mb-6">
                                {#if campaign.tokenomics.totalSupply}
                                    <div class="bg-gray-800/50 rounded-lg p-3">
                                        <div class="text-gray-400 text-sm mb-1">Total Supply</div>
                                        <div class="text-white font-medium">
                                            {campaign.tokenomics.totalSupply.toLocaleString()} {campaign.assets.token.name}
                                        </div>
                                    </div>
                                {/if}
                                {#if campaign.tokenomics.initialPrice}
                                    <div class="bg-gray-800/50 rounded-lg p-3">
                                        <div class="text-gray-400 text-sm mb-1">Initial Price</div>
                                        <div class="text-white font-medium">
                                            {campaign.tokenomics.initialPrice} {campaign.assets.base.name}
                                        </div>
                                    </div>
                                {/if}
                                {#if campaign.tokenomics.liquidityInfo}
                                    <div class="bg-gray-800/50 rounded-lg p-3 col-span-2">
                                        <div class="text-gray-400 text-sm mb-1">Liquidity Info</div>
                                        <div class="text-white font-medium">
                                            {campaign.tokenomics.liquidityInfo}
                                        </div>
                                    </div>
                                {/if}
                            </div>
                        {:else}
                            <!-- LP Campaign Info -->
                            <div class="grid grid-cols-2 gap-4 mb-6">
                                {#if campaign.tokenomics.estimatedApy}
                                    <div class="bg-gray-800/50 rounded-lg p-3">
                                        <div class="text-gray-400 text-sm mb-1">Estimated APY</div>
                                        <div class="text-white font-medium">
                                            {campaign.tokenomics.estimatedApy}%
                                        </div>
                                    </div>
                                {/if}
                                {#if campaign.tokenomics.farmingRewards}
                                    <div class="bg-gray-800/50 rounded-lg p-3">
                                        <div class="text-gray-400 text-sm mb-1">Rewards</div>
                                        <div class="text-white font-medium">
                                            {campaign.tokenomics.farmingRewards}
                                        </div>
                                    </div>
                                {/if}
                                {#if campaign.tokenomics.rewardsAllocation}
                                    <div class="bg-gray-800/50 rounded-lg p-3 col-span-2">
                                        <div class="text-gray-400 text-sm mb-1">Rewards Allocation</div>
                                        <div class="text-white font-medium">
                                            {campaign.tokenomics.rewardsAllocation}
                                        </div>
                                    </div>
                                {/if}
                            </div>
                        {/if}

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
                                    Raised: {(campaignBalances[campaign.id]?.baseToken?.current || 0).toLocaleString()} {campaign.assets.base.name}
                                </div>
                                <div class="text-gray-400">
                                    Target: {campaign.assets.base.targetAmount.toLocaleString()} {campaign.assets.base.name}
                                </div>
                            </div>
                        </div>

                        <!-- Contribution Limits -->
                        {#if campaign.tokenomics.minContribution || campaign.tokenomics.maxContribution}
                            <div class="flex justify-between mb-6 text-sm">
                                {#if campaign.tokenomics.minContribution}
                                    <div>
                                        <div class="text-gray-400 mb-1">Min Contribution</div>
                                        <div class="text-white">{campaign.tokenomics.minContribution} {campaign.assets.base.name}</div>
                                    </div>
                                {/if}
                                {#if campaign.tokenomics.maxContribution}
                                    <div>
                                        <div class="text-gray-400 mb-1">Max Contribution</div>
                                        <div class="text-white">{campaign.tokenomics.maxContribution} {campaign.assets.base.name}</div>
                                    </div>
                                {/if}
                                <div>
                                    <div class="text-gray-400 mb-1">Platform Fee</div>
                                    <div class="text-white">{MEW_FEE_PERCENTAGE}%</div>
                                </div>
                            </div>
                        {/if}

                        <!-- Timeline -->
                        <div class="mb-6">
                            <div class="flex items-center justify-between text-sm">
                                <div>
                                    <div class="text-gray-400 mb-1">Time Left</div>
                                    <div class="text-white">{calculateTimeLeft(campaign.endDate)}</div>
                                </div>
                                {#if campaign.tokenomics.vestingPeriod}
                                    <div>
                                        <div class="text-gray-400 mb-1">Vesting</div>
                                        <div class="text-white">{campaign.tokenomics.vestingPeriod}</div>
                                    </div>
                                {/if}
                                {#if campaign.tokenomics.liquidityLockPeriod}
                                    <div>
                                        <div class="text-gray-400 mb-1">LP Lock</div>
                                        <div class="text-white">{campaign.tokenomics.liquidityLockPeriod}</div>
                                    </div>
                                {/if}
                            </div>
                        </div>

                        <!-- Social Links -->
                        {#if Object.keys(campaign.links).length > 0}
                            <div class="flex space-x-4 mb-6">
                                {#each Object.entries(campaign.links) as [platform, url]}
                                    <a 
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        class="text-gray-400 hover:text-cyan-500 transition-colors"
                                    >
                                        <span class="capitalize">{platform}</span>
                                    </a>
                                {/each}
                            </div>
                        {/if}

                        <!-- Action Button -->
                        <button
                            class="w-full py-3 px-4 bg-cyan-500 hover:bg-cyan-600 text-black font-medium rounded-lg 
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
    {/each}
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
        color: rgb(209 213 219);
    }

    .inactive-tab:hover {
        background-color: var(--main-color);
        opacity: 0.7;
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