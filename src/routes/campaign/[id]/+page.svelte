<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { API_HOST } from '$lib/common/const.js';
    import { nFormatter } from '$lib/utils/utils.js';
    import CampaignTypeTag from '$lib/components/contribute/CampaignTypeTag.svelte';
    import StatusBadge from '$lib/components/contribute/StatusBadge.svelte';
    import AssetInfo from '$lib/components/contribute/AssetInfo.svelte';
    import SocialLinks from '$lib/components/contribute/SocialLinks.svelte';
    import ContributeModal from '$lib/components/contribute/ContributeModal.svelte';
    import CampaignFilter from '$lib/components/contribute/CampaignFilter.svelte';

    let campaigns = [];
    let selectedCampaign = null;
    let loading = true;
    let error = null;
    let showContributeModal = false;

    // Get campaign ID from URL query parameter
    $: campaignId = $page.url.searchParams.get('id');

    async function fetchCampaigns() {
        try {
            const response = await fetch(`${API_HOST}/mew/fund/getCampaigns`);
            const result = await response.json();
            campaigns = result.items;
            
            // If there's a campaign ID in the URL, find and set that campaign
            if (campaignId) {
                selectedCampaign = campaigns.find(c => c.id === campaignId);
            }
        } catch (err) {
            error = 'Failed to load campaigns';
        } finally {
            loading = false;
        }
    }

    // Watch for changes in campaignId
    $: if (campaignId && campaigns.length > 0) {
        selectedCampaign = campaigns.find(c => c.id === campaignId);
    }

    onMount(fetchCampaigns);

    function handleCampaignSelect(id: string) {
        const url = new URL(window.location);
        url.searchParams.set('id', id);
        window.history.pushState({}, '', url);
        
        selectedCampaign = campaigns.find(c => c.id === id);
    }
</script>

<div class="container mx-auto px-4 py-8">
    <div class="text-center mb-12">
        <h1 class="text-4xl font-bold text-white mb-4">Contribute</h1>
        <p class="text-gray-400 text-lg max-w-2xl mx-auto">
            Discover and participate in the latest blockchain projects across Ergo network.
        </p>
    </div>

    <!-- Campaign Filter -->
    <CampaignFilter />

    {#if loading}
        <div class="min-h-screen flex items-center justify-center">
            <div class="text-[var(--main-color)]">Loading campaigns...</div>
        </div>
    {:else if error}
        <div class="min-h-screen flex items-center justify-center">
            <div class="text-red-500">{error}</div>
        </div>
    {:else if selectedCampaign}
        <!-- Selected Campaign Details -->
        <div class="bg-[var(--forms-bg)] rounded-xl p-6 mb-6">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div class="flex items-center gap-3 mb-2">
                        <button 
                            class="text-[var(--main-color)] hover:text-[var(--main-color-hover)]"
                            on:click={() => handleCampaignSelect(null)}
                        >
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                            </svg>
                        </button>
                        <h1 class="text-3xl font-bold text-white">{selectedCampaign.title}</h1>
                        <CampaignTypeTag type={selectedCampaign.campaign_type} />
                        <StatusBadge status={selectedCampaign.status_phase} />
                    </div>
                    <p class="text-gray-400">{selectedCampaign.description}</p>
                </div>
                {#if selectedCampaign.status_phase === 'active'}
                    <button 
                        class="btn-primary px-8 py-3 rounded-lg text-lg font-medium"
                        on:click={() => showContributeModal = true}
                    >
                        Contribute Now
                    </button>
                {/if}
            </div>

            <!-- Campaign Details Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                <!-- Main Content -->
                <div class="lg:col-span-2 space-y-6">
                    <!-- Asset Information -->
                    <div class="bg-[var(--forms-bg)] rounded-xl p-6">
                        <AssetInfo 
                            asset={{
                                name: selectedCampaign.base_name,
                                iconUrl: selectedCampaign.base_icon_url,
                                tokenId: selectedCampaign.base_token_id,
                                currentAmount: selectedCampaign.base_raised || 0,
                                targetAmount: selectedCampaign.base_target_amount,
                                progress: (selectedCampaign.base_raised || 0) / selectedCampaign.base_target_amount * 100
                            }}
                            secondaryAsset={selectedCampaign.campaign_type !== 'crowdfund' ? {
                                name: selectedCampaign.token_name,
                                iconUrl: selectedCampaign.token_icon_url,
                                tokenId: selectedCampaign.token_id,
                                currentAmount: selectedCampaign.token_raised || 0,
                                targetAmount: selectedCampaign.token_target_amount,
                                progress: (selectedCampaign.token_raised || 0) / selectedCampaign.token_target_amount * 100
                            } : null}
                            stats={[
                                {
                                    label: 'Min Contribution',
                                    value: selectedCampaign.min_contribution,
                                    suffix: selectedCampaign.base_name
                                },
                                {
                                    label: 'Max Contribution',
                                    value: selectedCampaign.max_contribution,
                                    suffix: selectedCampaign.base_name
                                },
                                {
                                    label: 'LP Fee',
                                    value: selectedCampaign.lp_fee,
                                    format: 'percentage'
                                }
                            ]}
                        />
                    </div>

                    <!-- Campaign Results (if ended) -->
                    {#if selectedCampaign.status_phase === 'ended'}
                        <div class="bg-[var(--forms-bg)] rounded-xl p-6">
                            <!-- Results content -->
                        </div>
                    {/if}
                </div>

                <!-- Sidebar -->
                <div class="space-y-6">
                    <!-- Campaign Info -->
                    <div class="bg-[var(--forms-bg)] rounded-xl p-6">
                        <h2 class="text-xl font-bold text-white mb-4">Campaign Info</h2>
                        <div class="space-y-4">
                            <div>
                                <div class="text-[var(--main-color)] text-sm">Start Date</div>
                                <div class="text-white">(selectedCampaign.start_date)</div>
                            </div>
                            <div>
                                <div class="text-[var(--main-color)] text-sm">End Date</div>
                                <div class="text-white">(selectedCampaign.end_date)</div>
                            </div>
                        </div>
                    </div>

                    <!-- Social Links -->
                    <div class="bg-[var(--forms-bg)] rounded-xl p-6">
                        <h2 class="text-xl font-bold text-white mb-4">Links</h2>
                        <SocialLinks 
                            socials={{
                                website: selectedCampaign.website,
                                telegram: selectedCampaign.telegram,
                                twitter: selectedCampaign.twitter,
                                discord: selectedCampaign.discord
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    {:else}
        <!-- Campaign Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            {#each campaigns as campaign (campaign.id)}
                <!-- Campaign Card -->
                <div 
                    class="campaign-card relative rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer"
                    on:click={() => handleCampaignSelect(campaign.id)}
                >
                    <!-- Your existing campaign card content -->
                </div>
            {/each}
        </div>
    {/if}
</div>

<!-- Contribute Modal -->
{#if showContributeModal && selectedCampaign}
    <ContributeModal 
        campaign={selectedCampaign}
        onClose={() => showContributeModal = false}
    />
{/if}

<style>
    .campaign-card {
        background-color: var(--forms-bg);
        border: 2px solid var(--border-color);
    }

    .campaign-card:hover {
        border-color: var(--main-color);
        transform: translateY(-2px);
    }
</style>