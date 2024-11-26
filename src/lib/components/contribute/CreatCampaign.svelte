<script>
    import { createEventDispatcher } from 'svelte';
    
    const dispatch = createEventDispatcher();

    export let campaignData = {
        campaign_type: "crowdfund",
        title: "",
        description: "",
        start_date: "",
        end_date: ""
    };

    export let campaignTypes = [
        { value: 'crowdfund', label: 'Crowdfund' },
        { value: 'mintpluslp', label: 'Token Mint + LP' },
        { value: 'multiassetlp', label: 'Multi Asset LP' },
        { value: 'ergassetlp', label: 'ERG Asset LP' }
    ];

    function handleChange() {
        dispatch('change', campaignData);
    }
</script>
<div class="h-full flex flex-col grow main-page">
<div class="space-y-6">
    <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">Campaign Type</label>
        <select 
            bind:value={campaignData.campaign_type}
            class="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            on:change={handleChange}
        >
            {#each campaignTypes as type}
                <option value={type.value}>{type.label}</option>
            {/each}
        </select>
    </div>

    <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">Title</label>
        <input 
            type="text" 
            bind:value={campaignData.title}
            class="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            placeholder="Campaign title"
            on:input={handleChange}
        />
    </div>

    <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">Description</label>
        <textarea 
            bind:value={campaignData.description}
            class="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            rows="4"
            placeholder="Campaign description"
            on:input={handleChange}
        />
    </div>

    <div class="grid grid-cols-2 gap-6">
        <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
            <input 
                type="datetime-local" 
                bind:value={campaignData.start_date}
                class="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                on:change={handleChange}
            />
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">End Date</label>
            <input 
                type="datetime-local" 
                bind:value={campaignData.end_date}
                class="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                on:change={handleChange}
            />
        </div>
    </div>
</div>
</div>
<style>
    input[type="datetime-local"] {
        color-scheme: dark;
    }
</style>