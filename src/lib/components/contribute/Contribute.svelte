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
    import { showCustomToast, isWalletConected, getCommonBoxIds, nFormatter } from '$lib/utils/utils.js';
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
            // Using address prefix for network detection
            network: campaign.recipient_address.startsWith('9') ? 'ergo' : 'cardano'
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
            let baseTokenBalance = 0;
            let projectTokenBalance = 0;
            let basePercentage = 0;
            let projectPercentage = 0;

            if (campaign.network === 'ergo') {
                console.log('Fetching balances for campaign:', campaign.id);
                const response = await axios.get(`https://api.ergoplatform.com/api/v1/addresses/${campaign.recipient_address}/balance/total`);
                
                // Handle base token balance
                if (campaign.base_name === 'ERG') {
                    baseTokenBalance = response.data.confirmed.nanoErgs / Math.pow(10, 9);
                    console.log('ERG balance:', baseTokenBalance);
                } else if (campaign.base_token_id) {
                    // For non-ERG base token
                    const baseToken = response.data.confirmed.tokens.find(t => t.tokenId === campaign.base_token_id);
                    baseTokenBalance = baseToken ? baseToken.amount / Math.pow(10, campaign.base_decimals || 0) : 0;
                    console.log('Base token balance:', baseTokenBalance, 'Token ID:', campaign.base_token_id);
                }

                // Handle secondary token balance for LP creation
                if (campaign.token_policy_id) {
                    const projectToken = response.data.confirmed.tokens.find(t => t.tokenId === campaign.token_policy_id);
                    projectTokenBalance = projectToken ? projectToken.amount / Math.pow(10, campaign.token_decimals || 0) : 0;
                    console.log('Project token balance:', projectTokenBalance, 'Token ID:', campaign.token_policy_id);
                }

                // Calculate percentages
                basePercentage = Math.min((baseTokenBalance / parseFloat(campaign.base_target_amount || 0)) * 100, 100);
                if (campaign.token_target_amount) {
                    projectPercentage = Math.min((projectTokenBalance / parseFloat(campaign.token_target_amount || 0)) * 100, 100);
                }

                // Debug logging
                console.log('Campaign balances calculated:', {
                    campaignId: campaign.id,
                    baseToken: {
                        name: campaign.base_name,
                        balance: baseTokenBalance,
                        target: campaign.base_target_amount,
                        percentage: basePercentage
                    },
                    projectToken: {
                        name: campaign.token_name,
                        balance: projectTokenBalance,
                        target: campaign.token_target_amount,
                        percentage: projectPercentage
                    }
                });
            } else {
                // Cardano balance fetching logic here
                // TODO: Implement Cardano balance fetching
            }

            newBalances[campaign.id] = {
                baseToken: {
                    current: baseTokenBalance,
                    percentage: basePercentage
                },
                projectToken: {
                    current: projectTokenBalance,
                    percentage: projectPercentage
                }
            };
        } catch (error) {
            console.error('Error fetching balance for campaign:', campaign.id, error);
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

    function getDisclaimerMessage(campaign) {
        const liquidityPercentage = parseFloat(campaign.liquidity_info);
        if (liquidityPercentage === 100) {
            return 'This campaign is providing 100% of the funds raised as liquidity.';
        } else if (liquidityPercentage >= 75) {
            return 'This campaign is providing a high percentage (75% or more) of the funds raised as liquidity.';
        } else if (liquidityPercentage >= 50) {
            return 'This campaign is providing a moderate percentage (50% or more) of the funds raised as liquidity.';
        } else if (liquidityPercentage >= 25) {
            return 'This campaign is providing a low percentage (25% or more) of the funds raised as liquidity.';
        } else {
            return 'This campaign is providing a very low percentage (less than 25%) of the funds raised as liquidity.';
        }
    }

    function getLiquidityBorderColor(campaign) {
        const liquidityPercentage = parseFloat(campaign.liquidity_info);
        if (liquidityPercentage >= 75) {
            return 'border-green-500';
        } else if (liquidityPercentage >= 50) {
            return 'border-yellow-500';
        } else if (liquidityPercentage >= 25) {
            return 'border-orange-500';
        } else {
            return 'border-red-500';
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
            
            /*
            showCustomToast(`
                Contribution breakdown:<br>
                Total Amount: ${nFormatter(totalAmount)} ${selectedAsset.name}<br>
                To Campaign: ${nFormatter(amount)} ${selectedAsset.name} (100%)<br>
                Platform Fee: ${nFormatter(feeAmount)} ${selectedAsset.name} (${MEW_FEE_PERCENTAGE}%)
            `, 8000, 'info');
            */

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
                To Campaign: ${nFormatter(campaignAmount)} ${selectedCampaign.base_name}<br>
                Platform Fee (${MEW_FEE_PERCENTAGE}%): ${nFormatter(feeAmount)} ${selectedCampaign.base_name}
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
        <div class="text-center mb-12">
            <h1 class="text-4xl font-bold text-white mb-4">Contribute</h1>
            <p class="text-gray-400 text-lg max-w-2xl mx-auto">Discover and participate in the latest blockchain projects across Ergo and Cardano networks.</p>
        </div>

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

        <!-- Campaigns Grid -->
        <div class="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-6">
            {#each campaigns.filter(c => c.network === activeTab) as campaign (campaign.id)}
            {#if campaign.campaign_type === 'crowdfund'}
    <!-- Crowdfund Campaign Card -->
    <div class="campaign-card relative rounded-xl p-6 hover:shadow-lg transition-all">
        <!-- Header with Crowdfund Badge -->
        <div class="flex justify-between items-start mb-4">
            <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                    <h2 class="text-2xl font-bold text-white">{campaign.title}</h2>
                    <span class="px-3 py-1 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/20">
                        Crowdfund
                    </span>
                </div>
                <p class="text-gray-400 text-sm">{campaign.description}</p>
            </div>
            <div class="px-4 py-2 rounded-xl text-xs font-medium text-white
                      {campaign.status_phase === 'active' ? 'bg-green-500' : 'bg-yellow-500'}">
                {campaign.status_phase}
            </div>
        </div>

        <!-- Token Information -->
        <div class="mb-6">
            <div class="p-4 rounded-lg bg-gray-700 border-l-4 border-blue-500">
                <div class="flex items-center gap-2 mb-3">
                    {#if campaign.base_icon_url}
                        <img src={campaign.base_icon_url} alt={campaign.base_name} class="w-6 h-6 rounded-full"/>
                    {/if}
                    <span class="text-white font-medium">{campaign.base_name}</span>
                </div>
                
                <!-- Progress Bar -->
                <div class="space-y-2">
                    <div class="flex justify-between items-center mb-2">
                        <div class="text-gray-400 text-sm">Progress</div>
                        <div class="text-white text-sm font-medium">
                            {(campaignBalances[campaign.id]?.baseToken?.percentage || 0).toFixed(2)}%
                        </div>
                    </div>
                    <div class="w-full bg-gray-800 rounded-full h-2 mb-2">
                        <div 
                            class="bg-blue-500 rounded-full h-2 transition-all duration-500" 
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
            </div>
        </div>

        <!-- Campaign Details -->
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div class="p-3 rounded-lg bg-gray-700">
                <div class="text-gray-400 text-sm mb-1">Min Contribution</div>
                <div class="text-white font-medium">{nFormatter(campaign.min_contribution)} {campaign.base_name}</div>
            </div>
            <div class="p-3 rounded-lg bg-gray-700">
                <div class="text-gray-400 text-sm mb-1">Max Contribution</div>
                <div class="text-white font-medium">{nFormatter(campaign.max_contribution)} {campaign.base_name}</div>
            </div>
            <div class="p-3 rounded-lg bg-gray-700">
                <div class="text-gray-400 text-sm mb-1">Platform Fee</div>
                <div class="text-white font-medium">{MEW_FEE_PERCENTAGE}%</div>
            </div>

            <!-- Token ID -->
            <div class="p-3 rounded-lg bg-gray-700 md:col-span-3">
                <div class="flex justify-between items-center">
                    <span class="text-gray-400 text-sm">Token ID:</span>
                    <button 
                        class="flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-600 hover:bg-gray-500 text-white text-sm"
                        on:click={() => navigator.clipboard.writeText(campaign.token_id)}
                    >
                        <span class="truncate max-w-[150px]">{campaign.token_id}</span>
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>

        <!-- Social Links -->
        {#if campaign.website || campaign.telegram || campaign.twitter || campaign.discord}
            <div class="flex justify-center space-x-6 mb-6">
                {#if campaign.website}
                    <a href={campaign.website} target="_blank" rel="noopener noreferrer" 
                       class="text-gray-400 hover:text-blue-500 transition-colors">
                        <Globe size={20} />
                    </a>
                {/if}
                {#if campaign.telegram}
                    <a href={campaign.telegram} target="_blank" rel="noopener noreferrer" 
                       class="text-gray-400 hover:text-blue-500 transition-colors">
                        <MessageCircle size={20} />
                    </a>
                {/if}
                {#if campaign.twitter}
                    <a href={campaign.twitter} target="_blank" rel="noopener noreferrer" 
                       class="text-gray-400 hover:text-blue-500 transition-colors">
                        <Twitter size={20} />
                    </a>
                {/if}
                {#if campaign.discord}
                    <a href={campaign.discord} target="_blank" rel="noopener noreferrer" 
                       class="text-gray-400 hover:text-blue-500 transition-colors">
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
                if (campaign.status_phase === 'active') {
                    selectedCampaign = campaign;
                    showContributeModal = true;
                }
            }}
            disabled={campaign.status_phase !== 'active'}
        >
            {#if campaign.status_phase === 'active'}
                Contribute
            {:else}
                Coming Soon
            {/if}
        </button>
    </div>
{/if}
                {#if campaign.status_phase === 'ended'}
                    <!-- Ended Campaign Card -->
                    <div class="campaign-card relative rounded-xl p-6 hover:shadow-lg transition-all">
                        <!-- Header -->
                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <h2 class="text-2xl font-bold text-white mb-2">{campaign.title}</h2>
                                <p class="text-gray-400 text-sm">{campaign.description}</p>
                            </div>
                            <div class="px-4 py-2 rounded-xl text-xs font-medium bg-red-500 text-white">
                                Ended
                            </div>
                        </div>

                        <!-- Campaign Results -->
                        <div class="success-campaign-box bg-gray-800 rounded-lg p-6 mb-6">
                            <h3 class="text-xl font-semibold text-cyan-500 mb-4">Campaign Results</h3>
                            
                            <div class="space-y-4">
                                <div class="flex justify-between items-center">
                                    <span class="text-gray-400">Total Raised:</span>
                                    <span class="text-white font-medium">{campaign.total_contributed} {campaign.base_name}</span>
                                </div>

                                {#if campaign.lp_tokenid}
                                    <div>
                                        <div class="flex justify-between items-center mb-2">
                                            <span class="text-gray-400">LP Token:</span>
                                            <button 
                                                class="flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm"
                                                on:click={() => navigator.clipboard.writeText(campaign.lp_tokenid)}
                                            >
                                                <span class="truncate max-w-[150px]">{campaign.lp_tokenid}</span>
                                                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                            </button>
                                        </div>
                                        
                                        <div class="grid grid-cols-2 gap-4 mt-4">
                                            <div class="p-3 rounded-lg bg-gray-700">
                                                <div class="text-gray-400 text-sm mb-1">Total LP Share</div>
                                                <div class="text-white font-medium">{campaign.total_lp_share.toLocaleString()}</div>
                                            </div>
                                            <div class="p-3 rounded-lg bg-gray-700">
                                                <div class="text-gray-400 text-sm mb-1">LP Fee</div>
                                                <div class="text-white font-medium">{campaign.lp_fee}%</div>
                                            </div>
                                        </div>
                                    </div>
                                {/if}
                            </div>
                        </div>

                        <button
                            class="w-full py-3 px-4 btn btn-primary text-black font-medium rounded-lg opacity-50 cursor-not-allowed"
                            disabled
                        >
                            Campaign Ended
                        </button>
                    </div>

                {:else if !campaign.mint_new_token}
                    <!-- LP Creation Campaign Card -->
                    <div class="campaign-card relative rounded-xl p-6 hover:shadow-lg transition-all">
                        <!-- Header with LP Badge -->
                        <div class="flex justify-between items-start mb-4">
                            <div class="flex-1">
                                <div class="flex items-center gap-3 mb-2">
                                    <h2 class="text-2xl font-bold text-white">{campaign.title}</h2>
                                    <span class="px-3 py-1 rounded-lg text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/20">
                                        LP Creation
                                    </span>
                                </div>
                                <p class="text-gray-400 text-sm">{campaign.description}</p>
                            </div>
                            <div class="px-4 py-2 rounded-xl text-xs font-medium text-white
                                      {campaign.status_phase === 'active' ? 'bg-green-500' : 'bg-yellow-500'}">
                                {campaign.status_phase}
                            </div>
                        </div>

                        <!-- LP Pair Information -->
                        <div class="grid grid-cols-2 gap-4 mb-6">
                            <!-- First Token -->
                            <div class="p-4 rounded-lg bg-gray-700 border-l-4 border-cyan-500">
                                <div class="flex items-center gap-2 mb-3">
                                    {#if campaign.base_icon_url}
                                        <img src={campaign.base_icon_url} alt={campaign.base_name} class="w-6 h-6 rounded-full"/>
                                    {/if}
                                    <span class="text-white font-medium">{campaign.base_name}</span>
                                </div>
                                <div class="space-y-2">
                                    <div class="flex justify-between">
                                        <span class="text-gray-400 text-sm">Target:</span>
                                        <span class="text-white">{nFormatter(campaign.base_target_amount)} {campaign.base_name}</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-gray-400 text-sm">Progress:</span>
                                        <span class="text-white">{(campaignBalances[campaign.id]?.baseToken?.percentage || 0).toFixed(1)}%</span>
                                    </div>
                                </div>
                                <div class="mt-3 w-full bg-gray-800 rounded-full h-1.5">
                                    <div 
                                        class="bg-cyan-500 rounded-full h-1.5 transition-all duration-500" 
                                        style="width: {campaignBalances[campaign.id]?.baseToken?.percentage || 0}%"
                                    />
                                </div>
                            </div>

                            <!-- Second Token -->
                            <div class="p-4 rounded-lg bg-gray-700 border-l-4 border-purple-500">
                                <div class="flex items-center gap-2 mb-3">
                                    {#if campaign.token_icon_url}
                                        <img src={campaign.token_icon_url} alt={campaign.token_name} class="w-6 h-6 rounded-full"/>
                                    {/if}
                                    <span class="text-white font-medium">{campaign.token_name}</span>
                                </div>
                                <div class="space-y-2">
                                    <div class="flex justify-between">
                                        <span class="text-gray-400 text-sm">Target:</span>
                                        <span class="text-white">{nFormatter(campaign.token_target_amount)} {campaign.token_name}</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-gray-400 text-sm">Progress:</span>
                                        <span class="text-white">{(campaignBalances[campaign.id]?.projectToken?.percentage || 0).toFixed(1)}%</span>
                                    </div>
                                </div>
                                <div class="mt-3 w-full bg-gray-800 rounded-full h-1.5">
                                    <div 
                                        class="bg-purple-500 rounded-full h-1.5 transition-all duration-500" 
                                        style="width: {campaignBalances[campaign.id]?.projectToken?.percentage || 0}%"
                                    />
                                </div>
                            </div>
                        </div>

                        <!-- LP Details Grid -->
                        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                            <div class="p-3 rounded-lg bg-gray-700">
                                <div class="text-gray-400 text-sm mb-1">Min Contribution</div>
                                <div class="text-white font-medium">{nFormatter(campaign.min_contribution)} {campaign.base_name}</div>
                            </div>
                            <div class="p-3 rounded-lg bg-gray-700">
                                <div class="text-gray-400 text-sm mb-1">Max Contribution</div>
                                <div class="text-white font-medium">{nFormatter(campaign.max_contribution)} {campaign.base_name}</div>
                            </div>
                            <div class="p-3 rounded-lg bg-gray-700">
                                <div class="text-gray-400 text-sm mb-1">LP Fee</div>
                                <div class="text-white font-medium">{campaign.lp_fee}%</div>
                            </div>
                            <div class="p-3 rounded-lg bg-gray-700">
                                <div class="text-gray-400 text-sm mb-1">Platform Fee</div>
                                <div class="text-white font-medium">{MEW_FEE_PERCENTAGE}%</div>
                            </div>
                            <div class="p-3 rounded-lg bg-gray-700">
                                <div class="text-gray-400 text-sm mb-1">Mew LP Fee</div>
                                <div class="text-white font-medium">3%</div>
                            </div>
                        </div>

                        <!-- Social Links -->
                        {#if campaign.website || campaign.telegram || campaign.twitter || campaign.discord}
                            <div class="flex justify-center space-x-6 mb-6">
                                {#if campaign.website}
                                    <a href={campaign.website} target="_blank" rel="noopener noreferrer" 
                                       class="text-gray-400 hover:text-cyan-500 transition-colors">
                                        <Globe size={20} />
                                    </a>
                                {/if}
                                {#if campaign.telegram}
                                    <a href={campaign.telegram} target="_blank" rel="noopener noreferrer" 
                                       class="text-gray-400 hover:text-cyan-500 transition-colors">
                                        <MessageCircle size={20} />
                                    </a>
                                {/if}
                                {#if campaign.twitter}
                                    <a href={campaign.twitter} target="_blank" rel="noopener noreferrer" 
                                       class="text-gray-400 hover:text-cyan-500 transition-colors">
                                        <Twitter size={20} />
                                    </a>
                                {/if}
                                {#if campaign.discord}
                                    <a href={campaign.discord} target="_blank" rel="noopener noreferrer" 
                                       class="text-gray-400 hover:text-cyan-500 transition-colors">
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
                                if (campaign.status_phase === 'active') {
                                    selectedCampaign = campaign;
                                    showContributeModal = true;
                                }
                            }}
                            disabled={campaign.status_phase !== 'active'}
                        >
                            {#if campaign.status_phase === 'active'}
                                Contribute
                            {:else}
                                Coming Soon
                            {/if}
                        </button>
                    </div>

                {:else}
                    <!-- Token Minting Campaign Card -->
                    <div class="campaign-card relative rounded-xl p-6 hover:shadow-lg transition-all">
                        <!-- Header -->
                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <div class="flex items-center gap-3 mb-2">
                                    <h2 class="text-2xl font-bold text-white">{campaign.title}</h2>
                                    <span class="px-3 py-1 rounded-lg text-xs font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-500/20">
                                        Token Mint
                                    </span>
                                </div>
                                <p class="text-gray-400 text-sm">{campaign.description}</p>
                            </div>
                            <div class="px-4 py-2 rounded-xl text-xs font-medium text-white
                                        {campaign.status_phase === 'active' ? 'bg-green-500' : 'bg-yellow-500'}">
                                {campaign.status_phase}
                            </div>
                        </div>

                       <!-- Disclaimer -->
{#if getDisclaimerMessage(campaign)}
<div class="bg-var(--forms-bg) border {getLiquidityBorderColor(campaign)} p-3 rounded-lg mb-4 flex items-center">
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 {getLiquidityBorderColor(campaign)}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
    </svg>
    <p class="text-white font-medium text-sm">{getDisclaimerMessage(campaign)}</p>
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
    <div class="bg-cyan-500 rounded-full h-2 transition-all duration-500" style="width: {campaignBalances[campaign.id]?.baseToken?.percentage || 0}%"/>
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

<!-- Campaign Details -->
<div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
<div class="p-3 rounded-lg bg-gray-700">
    <div class="text-gray-400 text-sm mb-1">Supply</div>
    <div class="text-white font-medium">
        {#if campaign.total_supply}
            {campaign.total_supply.toLocaleString()}
        {/if}
    </div>
</div>
{#if campaign.initial_price}
    <div class="p-3 rounded-lg bg-gray-700">
        <div class="text-gray-400 text-sm mb-1">Initial Price</div>
        <div class="text-white font-medium">{campaign.initial_price} {campaign.base_name}</div>
    </div>
{/if}
<div class="p-3 rounded-lg bg-gray-700">
    <div class="text-gray-400 text-sm mb-1">Min Contribution</div>
    <div class="text-white font-medium">{nFormatter(campaign.min_contribution)} {campaign.base_name}</div>
</div>
<div class="p-3 rounded-lg bg-gray-700">
    <div class="text-gray-400 text-sm mb-1">Max Contribution</div>
    <div class="text-white font-medium">{nFormatter(campaign.max_contribution)} {campaign.base_name}</div>
</div>
<div class="p-3 rounded-lg bg-gray-700">
    <div class="text-gray-400 text-sm mb-1">LP Fee</div>
    <div class="text-white font-medium">{campaign.lp_fee}%</div>
</div>
<div class="p-3 rounded-lg bg-gray-700">
    <div class="text-gray-400 text-sm mb-1">Platform Fee</div>
    <div class="text-white font-medium">{MEW_FEE_PERCENTAGE}%</div>
</div>
<div class="p-3 rounded-lg bg-gray-700">
    <div class="text-gray-400 text-sm mb-1">Mew LP Fee</div>
    <div class="text-white font-medium">3%</div>
</div>
</div>

<!-- Social Links -->
{#if campaign.website || campaign.telegram || campaign.twitter || campaign.discord}
<div class="flex justify-center space-x-6 mb-6">
    {#if campaign.website}
        <a href={campaign.website} target="_blank" rel="noopener noreferrer" 
           class="text-gray-400 hover:text-cyan-500 transition-colors">
            <Globe size={20} />
        </a>
    {/if}
    {#if campaign.telegram}
        <a href={campaign.telegram} target="_blank" rel="noopener noreferrer" 
           class="text-gray-400 hover:text-cyan-500 transition-colors">
            <MessageCircle size={20} />
        </a>
    {/if}
    {#if campaign.twitter}
        <a href={campaign.twitter} target="_blank" rel="noopener noreferrer" 
           class="text-gray-400 hover:text-cyan-500 transition-colors">
            <Twitter size={20} />
        </a>
    {/if}
    {#if campaign.discord}
        <a href={campaign.discord} target="_blank" rel="noopener noreferrer" 
           class="text-gray-400 hover:text-cyan-500 transition-colors">
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
    if (campaign.status_phase === 'active') {
        selectedCampaign = campaign;
        showContributeModal = true;
    }
}}
disabled={campaign.status_phase !== 'active'}
>
{#if campaign.status_phase === 'active'}
    Contribute
{:else}
    Coming Soon
{/if}
</button>
                </div>
            {/if}
        {/each}
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
    display: flex;
    flex-direction: column;
    place-content: space-between;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    border: 2px solid var(--info-color); /* Add border using --info-color */
}


    .campaign-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
    }

    .active-tab {
        background-color: var(--main-color);
        color: white;
    }

    .inactive-tab {
        background-color: var(--forms-bg);
        color: rgb(209 213 219) !important;
    }
    .p-3 {
        background-color: var(--footer);
        color: rgb(209 213 219) !important;
    }

    .inactive-tab:hover {
        background-color: var(--main-color);
        color: var(--background) !important;
    }

    :global(.campaign-card) {
        background-color: var(--forms-bg);
    }

    .success-campaign-box {
        background-color: #211b2b;
        border: 1px solid rgb(6 182 212 / 0.2);
        box-shadow: 0 0 10px rgba(6, 182, 212, 0.1);
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

    .text-cyan-500 {
        color: rgb(6 182 212);
    }

    button:not(:disabled) {
        transition: all 0.3s ease;
    }

    button:not(:disabled):hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(6, 182, 212, 0.2);
    }

    /* Social icons hover animation */
    a:hover svg {
        transform: scale(1.1);
        transition: transform 0.2s ease;
    }
</style>