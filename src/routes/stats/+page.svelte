<script>
    import { onMount } from 'svelte';
    import { addCampaign } from '../stores/campaignStore';
    import BaseCampaignForm from '../components/BaseCampaignForm.svelte';
    import CrowdfundForm from '../components/CrowdfundForm.svelte';
    // Import other campaign type components similarly

    let currentStep = 1;
    const totalSteps = 2;

    let campaignData = {
        campaign_type: "crowdfund",
        title: "",
        description: "",
        start_date: "",
        end_date: "",
        min_contribution: 0,
        max_contribution: 0,
        base_name: "ERG",
        base_token_id: null,
        base_decimals: 9,
        base_target_amount: 0,
        recipient_address: ""
    };

    $: isFormValid = validateForm();

    function validateForm() {
        if (!campaignData.title || !campaignData.description) return false;
        if (!campaignData.start_date || !campaignData.end_date) return false;
        if (new Date(campaignData.start_date) >= new Date(campaignData.end_date)) return false;
        
        // Add type-specific validation
        if (campaignData.campaign_type === 'crowdfund') {
            if (!campaignData.recipient_address || campaignData.base_target_amount <= 0) return false;
        }
        
        return true;
    }

    function handleSubmit() {
        if (!isFormValid) {
            alert('Please fill all required fields');
            return;
        }

        addCampaign(campaignData);
        window.location.href = '/campaigns';
    }
</script>

<div class="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto">
        <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-white mb-2">Create New Campaign</h1>
            <p class="text-gray-400">Launch your project on the Ergo blockchain</p>
        </div>

        <div class="bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
            {#if currentStep === 1}
                <BaseCampaignForm 
                    {campaignData}
                    on:change={e => campaignData = e.detail}
                />
            {:else if currentStep === 2}
                {#if campaignData.campaign_type === 'crowdfund'}
                    <CrowdfundForm
                        {campaignData}
                        on:change={e => campaignData = {...campaignData, ...e.detail}}
                    />
                {/if}
                <!-- Add other campaign type forms here -->
            {/if}

            <!-- Navigation -->
            <div class="flex justify-between mt-8">
                <button
                    class="px-6 py-2 rounded-lg font-medium transition-colors
                           {currentStep === 1 ? 'opacity-50 cursor-not-allowed bg-gray-700 text-gray-400' : 
                           'bg-gray-700 text-white hover:bg-gray-600 border border-gray-600'}"
                    on:click={() => currentStep--}
                    disabled={currentStep === 1}
                >
                    Previous
                </button>

                {#if currentStep === totalSteps}
                    <button
                        class="px-6 py-2 rounded-lg font-medium transition-colors bg-cyan-500 hover:bg-cyan-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        on:click={handleSubmit}
                        disabled={!isFormValid}
                    >
                        Create Campaign
                    </button>
                {:else}
                    <button
                        class="px-6 py-2 rounded-lg font-medium transition-colors bg-cyan-500 hover:bg-cyan-600 text-white"
                        on:click={() => currentStep++}
                    >
                        Next
                    </button>
                {/if}
            </div>
        </div>
    </div>
</div>