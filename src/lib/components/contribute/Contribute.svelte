<script lang="ts">
    import { sendErgoTx } from "$lib/contract/sendErgoTx.ts";
    import { sendCardanoTx } from "$lib/contract/sendCardanoTx.ts";
    import ErgopayModal from '$lib/components/common/ErgopayModal.svelte';
    import ContributeModal from './ContributeModal.svelte';
    import { selected_wallet, connected_wallet_address } from "$lib/store/store.ts";
    import { fetchBoxes, getBlockHeight, updateTempBoxes } from '$lib/api-explorer/explorer.ts';  
    import { get } from "svelte/store";
    import { showCustomToast, isWalletConected, getCommonBoxIds } from '$lib/utils/utils.js';
    import { isWalletErgo, isWalletCardano} from '$lib/common/wallet.ts';
    import { API_HOST, FUNDING_CAMPAIGNS } from '$lib/common/const.js';
    import axios from "axios";
        import { onMount } from 'svelte';
        import { BigNumber } from 'bignumber.js';

    let showErgopayModal = false;
    let showContributeModal = false;
    let selectedCampaign = null;
    let isAuth = false;
    let unsignedTx = null;
  let campaignBalances = {};

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

    onMount(() => {
        updateBalances();
        // Update balances every 5 minutes
        const interval = setInterval(updateBalances, 300000);
        return () => clearInterval(interval);
    });
    function openContributeModal(campaign) {
        selectedCampaign = campaign;
        showContributeModal = true;
    }

    function onContributeModalClose() {
        showContributeModal = false;
        selectedCampaign = null;
    }

    function handleTxSubmitted(txId) {
        if (selectedCampaign) {
            logContribution('ergo', selectedCampaign.assets.base.name, amount, txId, selectedCampaign.id);
        }
    }

    async function logContribution(network, asset, amount, txid, campaignId) {
        try {
            await axios.post(`${API_HOST}/clb/logContribution`, {
                network,
                asset,
                amount,
                address: $connected_wallet_address,
                txid,
                campaignId
            });
        } catch (e) {
            console.error(e);
        }
    }

    let activeTab = 'ergo';
</script>
<div class="container">
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
            class="px-8 py-2 rounded-lg font-medium  text-black duration-200"
            class:active-tab={activeTab === 'cardano'}
            class:inactive-tab={activeTab !== 'cardano'}
            on:click={() => activeTab = 'cardano'}
        >
            Cardano Campaigns
        </button>
    </div>

     <!-- Updated Campaign Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each FUNDING_CAMPAIGNS[activeTab] as campaign (campaign.id)}
            <div class="campaign-card rounded-lg p-6 hover:shadow-lg transition-shadow">
                <h3 class="text-xl font-bold mb-2">{campaign.title}</h3>
                <p class="text-gray-300 text-sm mb-4">{campaign.description}</p>
                
                <div class="space-y-4">
                    <!-- Base Token Progress -->
                    <div>
                        <div class="flex items-center  justify-between mb-2">
                            <div class="flex items-center space-x-2">
                                <img src={campaign.assets.base.icon} alt={campaign.assets.base.name} class="w-6 h-6"/>
                                <span>{campaign.assets.base.name}</span>
                            </div>
                            <span class="text-sm">
                                {campaignBalances[campaign.id]?.baseToken?.current?.toLocaleString(undefined, {maximumFractionDigits: 2}) ?? '0'} / 
                                {campaign.assets.base.targetAmount.toLocaleString()}
                            </span>
                        </div>
                        <div class="w-full bg-gray-700 rounded-full h-2">
                            <div 
                                class="bg-main-color rounded-full h-2 transition-all duration-500" 
                                style="width: {campaignBalances[campaign.id]?.baseToken?.percentage ?? 0}%"
                            />
                        </div>
                    </div>

                    <!-- Project Token Progress -->
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <div class="flex items-center space-x-2">
                                <img src={campaign.assets.token.icon} alt={campaign.assets.token.name} class="w-6 h-6"/>
                                <span>{campaign.assets.token.name}</span>
                            </div>
                            <span class="text-sm">
                                {campaignBalances[campaign.id]?.projectToken?.current?.toLocaleString(undefined, {maximumFractionDigits: 2}) ?? '0'} / 
                                {campaign.assets.token.targetAmount.toLocaleString()}
                            </span>
                        </div>
                        <div class="w-full bg-gray-700 rounded-full h-2">
                            <div 
                                class="bg-main-color rounded-full h-2 transition-all duration-500" 
                                style="width: {campaignBalances[campaign.id]?.projectToken?.percentage ?? 0}%"
                            />
                        </div>
                    </div>
                </div>

                <div class="mt-4 text-sm text-gray-400">
                    Ends: {new Date(campaign.endDate).toLocaleDateString()}
                </div>

                <button
                    class="contribute-btn w-full mt-4 px-4 py-2 rounded-lg text-black transition-colors"
                    on:click={() => openContributeModal(campaign)}
                >
                    Contribute
                </button>
            </div>
        {/each}
    </div>

</div>
</div>
{#if showContributeModal}
    <ContributeModal 
        campaign={selectedCampaign}
        onClose={onContributeModalClose}
        bind:showErgopayModal
        bind:isAuth
        bind:unsignedTx
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

    .contribute-btn {
        background-color: var(--main-color);
        color: black; /* Set the button text color to black */
    }

    .contribute-btn:hover {
        opacity: 0.9;
        color: black; /* Ensure the text remains black on hover */
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
</style>

