<script>
    import { onMount, onDestroy } from 'svelte';
    import { sendErgoTx } from "$lib/contract/sendErgoTx.ts";
    import { sendCardanoTx } from "$lib/contract/sendCardanoTx.ts";
    import ErgopayModal from '$lib/components/common/ErgopayModal.svelte';
    import ContributeModal from './ContributeModal.svelte';
    import CampaignButton from './button.svelte';
    import StatusBadge from './StatusBadge.svelte';
    import CampaignTypeTag from './CampaignTypeTag.svelte';
    import SocialLinks from './SocialLinks.svelte';
    import AssetInfo from './AssetInfo.svelte';
    import CampaignResults from './CampaignResults.svelte';
    import CopyableAddress from './CopyableAddress.svelte';
    import CreateCampaignModal from './CreateCampaignModal.svelte';
    import Loading from '$lib/components/common/Loading.svelte';
    import { selected_wallet, connected_wallet_address } from "$lib/store/store.ts";
    import { fetchBoxes, getBlockHeight, updateTempBoxes } from '$lib/api-explorer/explorer.ts';
    import { get } from "svelte/store";
    import { showCustomToast, isWalletConected, getCommonBoxIds, nFormatter } from '$lib/utils/utils.js';
    import { isWalletErgo, isWalletCardano } from '$lib/common/wallet.ts';
    import { API_HOST, MEW_FEE_PERCENTAGE } from '$lib/common/const.js';
    import axios from "axios";
    import { BigNumber } from 'bignumber.js';
    import CampaignAlert from '$lib/components/ui/CampaignAlert.svelte';
    import CampaignFilter from './CampaignFilter.svelte';

    // Component state
    let showErgopayModal = false;
    let showContributeModal = false;
    let selectedCampaign = null;
    let isAuth = false;
    let unsignedTx = null;
    let activeTab = 'ergo';
    let campaigns = [];
    let campaignBalances = {};
    let loading = true;
    let showCreateModal = false;


    export let endDate;
    export let startDate;
    export let status;

    let timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
    let intervalId;

    function calculateTimeLeft() {
        const now = new Date().getTime();
        const targetDate = status === 'upcoming' ? 
            new Date(startDate).getTime() : 
            new Date(endDate).getTime();
        const difference = targetDate - now;

        if (difference <= 0) {
            return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }

        return {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((difference % (1000 * 60)) / 1000)
        };
    }

    function updateTimer() {
        timeLeft = calculateTimeLeft();
    }

    onMount(() => {
        updateTimer();
        intervalId = setInterval(updateTimer, 1000);
    });

    onDestroy(() => {
        if (intervalId) clearInterval(intervalId);
    });

    $: timeString = status === 'upcoming' ? 'Starts in:' : 'Ends in:';
    $: isEnded = status === 'ended' || 
        (timeLeft.days === 0 && timeLeft.hours === 0 && 
         timeLeft.minutes === 0 && timeLeft.seconds === 0);
    // Utility Functions
    function getTimeRemaining(campaign) {
        const now = new Date().getTime();
        const endDate = new Date(campaign.end_date).getTime();
        const timeRemaining = endDate - now;

        if (timeRemaining <= 0) return 'Ended';

        const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

        return days > 0 ? `${days}d ${hours}h remaining` :
               hours > 0 ? `${hours}h ${minutes}m remaining` :
               `${minutes}m remaining`;
    }

    function getCampaignStatus(campaign) {
    // First check if backend says it's ended
    if (campaign.status_phase === 'ended') {
        return 'ended';
    }

    const now = new Date();
    const startDate = campaign.start_date ? new Date(campaign.start_date) : null;
    const endDate = new Date(campaign.end_date);
    
    // Convert all to UTC timestamps
    const nowUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 
                           now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
    const startUTC = startDate ? Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), 
                                        startDate.getUTCDate(), startDate.getUTCHours(), 
                                        startDate.getUTCMinutes(), startDate.getUTCSeconds()) : null;
    const endUTC = Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate(), 
                           endDate.getUTCHours(), endDate.getUTCMinutes(), endDate.getUTCSeconds());
    
    // Time-based checks only if not ended in backend
    if (startUTC && nowUTC < startUTC) return 'upcoming';
    if (nowUTC > endUTC) return 'ended';
    if ((!startUTC || nowUTC >= startUTC) && nowUTC <= endUTC) return 'active';
    
    return 'inactive';
}

    function calculateProgress(contribution, targetAmount) {
        if (!targetAmount || !contribution) return 0;
        return Math.min((contribution / parseFloat(targetAmount)) * 100, 100);
    }

    function formatAddress(address, length = 8) {
        if (!address) return '';
        return `${address.slice(0, length)}...${address.slice(-length)}`;
    }

    function getContributionAmount(campaign, tokenId) {
        if (!campaign.contributions) return 0;
        const contribution = campaign.contributions.find(c => 
            tokenId === null || tokenId === 'ERG' ? 
            c.asset === 'ERG' : c.asset === tokenId
        );
        return contribution ? contribution.amount : 0;
    }
//Add these to your existing script section where other state variables are defined
let selectedStatus = 'active';
let selectedType = 'all';

// Update your getFilteredCampaigns function
function getFilteredCampaigns(campaigns) {
    return campaigns.filter(c => 
        c.network === activeTab && 
        getCampaignStatus(c) === selectedStatus &&
        (selectedType === 'all' || c.campaign_type === selectedType)
    );
}

// Add this handler
function handleFilterChange(event) {
    const { status, type } = event.detail;
    selectedStatus = status;
    selectedType = type;
}

    // Campaign Management
    async function fetchCampaigns() {
        try {
            const response = await axios.get(`${API_HOST}/mew/fund/getCampaigns`);
            if (!response.data.items) return;

            campaigns = response.data.items.map(campaign => ({
                ...campaign,
                network: campaign.recipient_address.startsWith('9') ? 'ergo' : 'cardano'
            }));
            await updateBalances();
        } catch (error) {
            showCustomToast('Failed to fetch campaigns', 5000, 'danger');
        } finally {
            loading = false;
        }
    }

    async function updateBalances() {
        const newBalances = {};
        for (const campaign of campaigns) {
            try {
                const basePercentage = Math.min(
                    (campaign.total_contributed / parseFloat(campaign.base_target_amount || 0)) * 100, 
                    100
                );
                
                const projectPercentage = !campaign.mint_new_token && campaign.token_target_amount > 0 ?
                    Math.min((campaign.total_contributed / parseFloat(campaign.base_target_amount || 0)) * 100, 100) : 0;

                newBalances[campaign.id] = {
                    baseToken: {
                        current: campaign.total_contributed,
                        percentage: basePercentage
                    },
                    projectToken: {
                        current: campaign.total_contributed,
                        percentage: projectPercentage
                    }
                };
            } catch (error) {
                console.error('Error calculating balances for campaign:', campaign.id, error);
            }
        }
        campaignBalances = newBalances;
    }

    // Transaction Handlers
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
                myAddress, utxos, selectedAsset.name, amount, height,
                selectedCampaign.id, tokenId, selectedCampaign.recipient_address,
                selectedAsset.decimals
            );

            if (selectedWalletErgo === 'ergopay') {
                unsignedTx = unsigned;
                isAuth = false;
                showErgopayModal = true;
                showContributeModal = false;
                return null;
            }

            const signed = await ergo.sign_tx(unsigned);
            const txId = await ergo.submit_tx(signed);

            if (txId) {
                const usedBoxIds = getCommonBoxIds(utxos, signed.inputs);
                const newOutputs = signed.outputs.filter(output => output.ergoTree === utxos[0].ergoTree);
                updateTempBoxes(myAddress, usedBoxIds, newOutputs);
                return txId;
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
                walletApi, selectedAsset.name, amount, selectedCampaign.id,
                selectedAsset.tokenId, selectedAsset.name, selectedCampaign.recipient_address,
                selectedAsset.decimals
            );
        } catch (e) {
            handleTransactionError(e);
            return null;
        }
    }
   
    let isModalOpen = false;

    function openModal() {
        isModalOpen = true;
    }

    function closeModal() {
        isModalOpen = false;
    }
    async function handleContribution(event) {
        const { amount, selectedAsset } = event.detail;
        if (loading || !amount || !selectedAsset) return;
        
        loading = true;
        try {
            const network = activeTab;
            const totalAmount = new BigNumber(amount);
            const feePercentage = new BigNumber(MEW_FEE_PERCENTAGE).dividedBy(100);
            const campaignAmount = totalAmount.dividedBy(new BigNumber(1).plus(feePercentage));
            const feeAmount = totalAmount.minus(campaignAmount);

            let txId;
            if (network === 'ergo') {
                const selectedWalletErgo = get(selected_wallet);
                if (!isWalletErgo(selectedWalletErgo) || !isWalletConected()) {
                    showCustomToast('Please connect an Ergo wallet first.', 1500, 'info');
                    return;
                }
                txId = await handleErgoContribution(amount, selectedAsset);
            } else {
                const selectedWalletCardano = get(selected_wallet);
                if (!isWalletCardano(selectedWalletCardano) || !isWalletConected()) {
                    showCustomToast('Please connect a Cardano wallet first.', 1500, 'info');
                    return;
                }
                txId = await handleCardanoContribution(amount, selectedAsset);
            }

            if (txId) {
                showCustomToast(
                    `Transaction submitted successfully.<br>TX ID: <a target="_new" href="${
                        network === 'ergo' ? 'https://ergexplorer.com/transactions/' : 'https://cardanoscan.io/transaction/'
                    }${txId}">${txId}</a>`,
                    5000,
                    'success'
                );
                
                onContributeModalClose();
                await updateBalances();
            }
        } catch (error) {
            showCustomToast('Failed to process contribution. Please try again.', 5000, 'danger');
        } finally {
            loading = false;
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

    function handleClick() {
        showCustomToast('Campaign creation coming soon! Stay tuned for updates.', 3000, 'info');
    }

    function onContributeModalClose() {
        showContributeModal = false;
        selectedCampaign = null;
    }

    // Lifecycle
    onMount(() => {
        fetchCampaigns();
        const interval = setInterval(updateBalances, 300000);
        return () => clearInterval(interval);
    });
        // Add this helper function to format dates
        function formatDateForCountdown(date) {
        if (!date) return '';
        const d = new Date(date);
        return `${d.getDate().toString().padStart(2, '0')}-${
            (d.getMonth() + 1).toString().padStart(2, '0')}-${
            d.getFullYear()} ${
            d.getHours().toString().padStart(2, '0')}:${
            d.getMinutes().toString().padStart(2, '0')}:${
            d.getSeconds().toString().padStart(2, '0')}`;
    }
      function isCampaignLive(startDate) {
        return new Date() >= new Date(startDate);
    }


</script>


<CreateCampaignModal bind:showModal={showCreateModal} />

<div class="container top-margin text-white mb-5">
    
    <div class="container mx-auto px-0 max-w-6xl">
        
      
        <CampaignAlert />
        <CampaignFilter 
        selectedStatus={selectedStatus}
        selectedType={selectedType}
        on:filterChange={handleFilterChange}
    />
    

{#if loading}
    <Loading />
{:else}
<!-- Main Grid -->
<div class="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-6">
    {#each getFilteredCampaigns(campaigns) as campaign (campaign.id)}
        {#if campaign.status_phase === 'ended'}
            <!-- Ended Campaign Card -->
            <div class="campaign-card relative rounded-xl p-6 hover:shadow-lg transition-all">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h2 class="text-2xl font-bold text-white mb-2">{campaign.title}</h2>
                        <pre class="text-gray-400 text-sm" style="white-space: break-spaces;">{campaign.description}</pre>
                    </div>
                    <StatusBadge status="ended" />
                </div>
                <CampaignResults
                campaign={campaign}
            />

              
            </div>
            {:else if campaign.campaign_type === 'mintpluslp'}
            <!-- Mint + LP Campaign Card -->
            <div class="campaign-card relative rounded-xl p-6 hover:shadow-lg transition-all">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <div class="flex items-center gap-3 mb-2">
                            <h2 class="text-2xl font-bold text-white">{campaign.title}</h2>
                            <CampaignTypeTag type="mintpluslp" />
                            <StatusBadge status={getCampaignStatus(campaign)} />
                        </div>
                        <pre class="text-gray-400 text-sm" style="white-space: break-spaces;">{campaign.description}</pre>
                    </div>
                </div>
        
                {#if campaign.status_phase === 'ended'}
                    <CampaignResults 
                        campaign={{
                            ...campaign,
                            type: 'mintpluslp',
                            minted_token_id: campaign.token_policy_id,
                            pool_token_id: campaign.lp_token_id
                        }} 
                    />
                {:else}
                    <AssetInfo
                        asset={{
                            name: campaign.base_name,
                            iconUrl: campaign.base_icon_url,
                            tokenId: campaign.base_token_id,
                            currentAmount: getContributionAmount(campaign, campaign.base_token_id),
                            targetAmount: campaign.base_target_amount,
                            progress: calculateProgress(
                                getContributionAmount(campaign, campaign.base_token_id),
                                campaign.base_target_amount
                            )
                        }}
                        secondaryAsset={{
                            name: campaign.token_name,
                            iconUrl: campaign.token_icon_url,
                            tokenId: campaign.token_policy_id,
                            currentAmount: getContributionAmount(campaign, campaign.token_policy_id),
                            targetAmount: campaign.token_target_amount,
                            minAmount: campaign.min_token,
                            maxAmount: campaign.max_token,
                            progress: calculateProgress(
                                getContributionAmount(campaign, campaign.token_policy_id),
                                campaign.token_target_amount
                            )
                        }}
                        campaignType="mintpluslp"
                        showTokenId={true}
                        stats={[
                            {
                                label: 'Min Contribution',
                                value: campaign.min_contribution,
                                format: 'number',
                                suffix: campaign.base_name
                            },
                            {
                                label: 'Max Contribution',
                                value: campaign.max_contribution,
                                format: 'number',
                                suffix: campaign.base_name
                            },
                            {
                                label: 'Platform Fee',
                                value: campaign.platform_fee,
                                format: 'percentage'
                            },
                            {
                                label: 'LP Fee',
                                value: campaign.lp_fee,
                                format: 'percentage'
                            }
                        ]}
                        startDate={campaign.start_date}
                        endDate={campaign.end_date}
                        status={getCampaignStatus(campaign)}
                        poolId={campaign.lp_token_id}
                        totalSupply={campaign.total_supply}
                        initialPrice={campaign.initial_price}
                    />
                    <SocialLinks
                        socials={{
                            website: campaign.website,
                            telegram: campaign.telegram,
                            twitter: campaign.twitter,
                            discord: campaign.discord
                        }}
                        accentColor="cyan"
                    />
                    <CampaignButton
                        status={getCampaignStatus(campaign)}
                        startDate={campaign.start_date}
                        onClick={() => {
                            if (getCampaignStatus(campaign) === 'active') {
                                selectedCampaign = campaign;
                                showContributeModal = true;
                            }
                        }}
                        loading={loading}
                    />
                {/if}
            </div>
            {:else if campaign.campaign_type === 'multiassetlp'}
            <!-- Multi Asset LP Campaign Card -->
            <div class="campaign-card relative rounded-xl p-6 hover:shadow-lg transition-all">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <div class="flex items-center gap-3 mb-2">
                            <h2 class="text-2xl font-bold text-white">{campaign.title}</h2>
                            <CampaignTypeTag type="multiassetlp" />
                            <StatusBadge status={getCampaignStatus(campaign)} />
                        </div>
                        <pre class="text-gray-400 text-sm" style="white-space: break-spaces;">{campaign.description}</pre>
                    </div>
                </div>
        
                {#if campaign.status_phase === 'ended'}
                    <CampaignResults 
                        campaign={{
                            ...campaign,
                            type: 'multiassetlp',
                            pool_token_id: campaign.lp_token_id,
                            mewfinance_url: `https://app.mewfinance.com/pools/${campaign.lp_token_id}`
                        }} 
                    />
                {:else}
                    <AssetInfo
                        asset={{
                            name: campaign.base_name,
                            iconUrl: campaign.base_icon_url,
                            tokenId: campaign.base_token_id,
                            currentAmount: getContributionAmount(campaign, campaign.base_token_id),
                            targetAmount: campaign.base_target_amount,
                            progress: calculateProgress(
                                getContributionAmount(campaign, campaign.base_token_id),
                                campaign.base_target_amount
                            )
                        }}
                        secondaryAsset={{
                            name: campaign.token_name,
                            iconUrl: campaign.token_icon_url,
                            tokenId: campaign.token_policy_id,
                            currentAmount: getContributionAmount(campaign, campaign.token_id),
                            targetAmount: campaign.token_target_amount,
                            minAmount: campaign.min_token,
                            maxAmount: campaign.max_token,
                            progress: calculateProgress(
                                getContributionAmount(campaign, campaign.token_id),
                                campaign.token_target_amount
                            )
                        }}
                        campaignType="multiassetlp"
                        showTokenId={true}
                        stats={[
                            {
                                label: 'Min Contribution',
                                value: campaign.min_contribution,
                                format: 'number',
                                suffix: campaign.base_name
                            },
                            {
                                label: 'Max Contribution',
                                value: campaign.max_contribution,
                                format: 'number',
                                suffix: campaign.base_name
                            },
                            {
                                label: 'Platform Fee',
                                value: campaign.platform_fee,
                                format: 'percentage'
                            },
                            {
                                label: 'LP Fee',
                                value: campaign.lp_fee,
                                format: 'percentage'
                            }
                        ]}
                        startDate={campaign.start_date}
                        endDate={campaign.end_date}
                        status={getCampaignStatus(campaign)}
                        poolId={campaign.lp_token_id}
                        totalSupply={campaign.total_supply}
                        initialPrice={campaign.initial_price}
                    />
                    <SocialLinks
                        socials={{
                            website: campaign.website,
                            telegram: campaign.telegram,
                            twitter: campaign.twitter,
                            discord: campaign.discord
                        }}
                        accentColor="cyan"
                    />
                    <CampaignButton
                        status={getCampaignStatus(campaign)}
                        startDate={campaign.start_date}
                        onClick={() => {
                            if (getCampaignStatus(campaign) === 'active') {
                                selectedCampaign = campaign;
                                showContributeModal = true;
                            }
                        }}
                        loading={loading}
                    />
                {/if}
            </div>
            {:else if campaign.campaign_type === 'ergassetlp'}
            <!-- Multi Asset LP Campaign Card -->
            <div class="campaign-card relative rounded-xl p-6 hover:shadow-lg transition-all">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <div class="flex items-center gap-3 mb-2">
                            <h2 class="text-2xl font-bold text-white">{campaign.title}</h2>
                            <CampaignTypeTag type="ergassetlp" />
                            <StatusBadge status={getCampaignStatus(campaign)} />
                        </div>
                        <pre class="text-gray-400 text-sm" style="white-space: break-spaces;">{campaign.description}</pre>
                    </div>
                </div>
        
                {#if campaign.status_phase === 'ended'}
                    <CampaignResults 
                        campaign={{
                            ...campaign,
                            type: 'ergassetlp',
                            pool_token_id: campaign.lp_token_id,
                            mewfinance_url: `https://app.mewfinance.com/pools/${campaign.lp_token_id}`
                        }} 
                    />
                {:else}
                    <AssetInfo
                        asset={{
                            name: campaign.base_name,
                            iconUrl: campaign.base_icon_url,
                            tokenId: campaign.base_token_id,
                            currentAmount: getContributionAmount(campaign, campaign.base_token_id),
                            targetAmount: campaign.base_target_amount,
                            progress: calculateProgress(
                                getContributionAmount(campaign, campaign.base_token_id),
                                campaign.base_target_amount
                            )
                        }}
                        secondaryAsset={{
                            name: campaign.token_name,
                            iconUrl: campaign.token_icon_url,
                            tokenId: campaign.token_policy_id,
                            currentAmount: getContributionAmount(campaign, campaign.token_id),
                            targetAmount: campaign.token_target_amount,
                            minAmount: campaign.min_token,
                            maxAmount: campaign.max_token,
                            progress: calculateProgress(
                                getContributionAmount(campaign, campaign.token_id),
                                campaign.token_target_amount
                            )
                        }}
                        campaignType="multiassetlp"
                        showTokenId={true}
                        stats={[
                            {
                                label: 'Min Contribution',
                                value: campaign.min_contribution,
                                format: 'number',
                                suffix: campaign.base_name
                            },
                            {
                                label: 'Max Contribution',
                                value: campaign.max_contribution,
                                format: 'number',
                                suffix: campaign.base_name
                            },
                            {
                                label: 'Platform Fee',
                                value: campaign.platform_fee,
                                format: 'percentage'
                            },
                            {
                                label: 'LP Fee',
                                value: campaign.lp_fee,
                                format: 'percentage'
                            }
                        ]}
                        startDate={campaign.start_date}
                        endDate={campaign.end_date}
                        status={getCampaignStatus(campaign)}
                        poolId={campaign.lp_token_id}
                        totalSupply={campaign.total_supply}
                        initialPrice={campaign.initial_price}
                    />
                    <SocialLinks
                        socials={{
                            website: campaign.website,
                            telegram: campaign.telegram,
                            twitter: campaign.twitter,
                            discord: campaign.discord
                        }}
                        accentColor="cyan"
                    />
                    <CampaignButton
                        status={getCampaignStatus(campaign)}
                        startDate={campaign.start_date}
                        onClick={() => {
                            if (getCampaignStatus(campaign) === 'active') {
                                selectedCampaign = campaign;
                                showContributeModal = true;
                            }
                        }}
                        loading={loading}
                    />
                {/if}
            </div>
        {:else}
            <!-- Crowdfund Campaign Card -->
            <div class="campaign-card relative rounded-xl p-6 hover:shadow-lg transition-all">
                <div class="flex justify-between items-start mb-4">
                    <div class="flex-1 w-full">
                        <div class="flex items-center gap-3 mb-2">
                            <h2 class="text-2xl font-bold text-white">{campaign.title}</h2>
                            <CampaignTypeTag type="crowdfund" />
                            <StatusBadge status={getCampaignStatus(campaign)} />
                        </div>
                        <pre class="text-gray-400 text-sm" style="white-space: break-spaces;">{campaign.description}</pre>
                    </div>
                </div>

                <AssetInfo
                asset={{
                    name: campaign.base_name,
                    iconUrl: campaign.base_icon_url,
                    currentAmount: getContributionAmount(campaign, campaign.base_token_id),
                    targetAmount: campaign.base_target_amount,
                    progress: calculateProgress(
                        getContributionAmount(campaign, campaign.base_token_id),
                        campaign.base_target_amount
                    )
                }}
                secondaryAsset={campaign.token_target_amount ? {
                    name: campaign.token_name,
                    iconUrl: campaign.token_icon_url,
                    currentAmount: getContributionAmount(campaign, campaign.token_policy_id),
                    targetAmount: campaign.token_target_amount,
                    progress: calculateProgress(
                        getContributionAmount(campaign, campaign.token_policy_id),
                        campaign.token_target_amount
                    )
                } : null}
                showTokenId={true}
                stats={[
                    {
                        label: 'Min Contribution',
                        value: campaign.min_contribution,
                        format: 'number',
                        suffix: campaign.base_name
                    },
                    {
                        label: 'Max Contribution',
                        value: campaign.max_contribution,
                        format: 'number',
                        suffix: campaign.base_name
                    },
                    {
                        label: 'Platform Fee',
                        value: campaign.platform_fee,
                        format: 'percentage'
                    },
                ]}
                columns={3}
                startDate={campaign.start_date}
                endDate={campaign.end_date}
            />

                {#if campaign.recipient_address}
                    <CopyableAddress
                        label="Crowdfunder"
                        address={campaign.applicant}
                    />
                {/if}

                <SocialLinks 
                    socials={{
                        website: campaign.website,
                        telegram: campaign.telegram,
                        twitter: campaign.twitter,
                        discord: campaign.discord
                    }}
                    accentColor="blue"
                />

                <CampaignButton 
                    status={getCampaignStatus(campaign)}
                    startDate={campaign.start_date}
                    onClick={() => {
                        if (getCampaignStatus(campaign) === 'active') {
                            selectedCampaign = campaign;
                            showContributeModal = true;
                        }
                    }}
                    loading={loading}
                />
            </div>
        {/if}
    {/each}
</div>
{/if}
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
        border: 2px solid var(--main-color);
    }

    .campaign-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
    }

    :global(.campaign-card) {
        background-color: var(--forms-bg);
    }

    .active-status {
        background-color: var(--main-color);
        color: var(--background);
    }

    .inactive-status {
        background-color: var(--forms-bg);
        color: rgb(209 213 219);
    }

    .inactive-status:hover {
        background-color: var(--main-color);
        color: var(--background);
    }
</style>