<script>
    import { createEventDispatcher } from 'svelte';
    
    const dispatch = createEventDispatcher();

    export let campaignData = {
        recipient_address: "",
        base_name: "ERG",
        base_target_amount: 0,
        min_contribution: 0,
        max_contribution: 0
    };

    function handleChange() {
        dispatch('change', campaignData);
    }
</script>

<div class="space-y-6">
    <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">Recipient Address</label>
        <input 
            type="text" 
            bind:value={campaignData.recipient_address}
            class="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            placeholder="Ergo address"
            on:input={handleChange}
        />
    </div>

    <div class="grid grid-cols-2 gap-6">
        <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
                Target Amount ({campaignData.base_name})
            </label>
            <input 
                type="number" 
                bind:value={campaignData.base_target_amount}
                class="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                placeholder="Target amount"
                on:input={handleChange}
            />
        </div>
    </div>

    <div class="grid grid-cols-2 gap-6">
        <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
                Min Contribution ({campaignData.base_name})
            </label>
            <input 
                type="number" 
                bind:value={campaignData.min_contribution}
                class="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                placeholder="Minimum"
                on:input={handleChange}
            />
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
                Max Contribution ({campaignData.base_name})
            </label>
            <input 
                type="number"
                bind:value={campaignData.max_contribution}
                class="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                placeholder="Maximum"
                on:input={handleChange}
            />
        </div>
    </div>
</div>

<style>
    input[type="number"] {
        -moz-appearance: textfield;
    }
    input[type="number"]::-webkit-inner-spin-button,
    input[type="number"]::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
</style>