<script lang="ts">
    import { campaigns } from '$lib/store/campaignStore';

    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString();
    }

    function deleteCampaign(id) {
        campaigns.update(currentCampaigns => 
            currentCampaigns.filter(campaign => campaign.id !== id)
        );
    }
</script>
<div class="h-full flex flex-col grow main-page">

  
        <div class="flex justify-between items-center mb-8">
            <h1 class="text-3xl font-bold">Active Campaigns</h1>
            <a href="/new" class="btn">
                Create Campaign
            </a>
        </div>

        {#if $campaigns.length === 0}
            <div class="text-center py-12 bg-[#1b2845] bg-opacity-50 rounded-xl backdrop-blur-sm">
                <h2 class="text-xl">No campaigns yet</h2>
                <p class="mt-2 text-gray-400">Create your first campaign to get started</p>
            </div>
        {:else}
            <div class="grid gap-6">
                {#each $campaigns as campaign}
                    <div class="bg-[#1b2845] bg-opacity-50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                        <div class="flex justify-between items-start">
                            <div>
                                <h2 class="text-xl font-bold mb-2">{campaign.title}</h2>
                                <p class="text-gray-400 mb-4">{campaign.description}</p>
                                
                                <div class="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span class="text-gray-400">Type:</span>
                                        <span class="ml-2">{campaign.campaign_type}</span>
                                    </div>
                                    <div>
                                        <span class="text-gray-400">Target:</span>
                                        <span class="ml-2">
                                            {campaign.base_target_amount} {campaign.base_name}
                                        </span>
                                    </div>
                                    <div>
                                        <span class="text-gray-400">Start:</span>
                                        <span class="ml-2">{formatDate(campaign.start_date)}</span>
                                    </div>
                                    <div>
                                        <span class="text-gray-400">End:</span>
                                        <span class="ml-2">{formatDate(campaign.end_date)}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <button
                                class="btn-secondary p-2"
                                on:click={() => deleteCampaign(campaign.id)}
                            >
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
