<script lang="ts">
    export let data = {
        base_name: "ERG",
        token_name: "",
        token_description: "",
        token_decimals: 0,
        total_supply: 0,
        liquidity_info: "100%",
        lp_fee: 3,
        base_target_amount: 0,
        min_contribution: 0,
        max_contribution: 0
    };

    const lpOptions = ["100%", "75%", "50%"];
</script>

<div class="space-y-6">
    <div class="grid grid-cols-2 gap-6">
        <div>
            <label class="block text-sm font-medium mb-2">Token Name</label>
            <input 
                type="text" 
                bind:value={data.token_name}
                class="w-full p-3 rounded-lg bg-[#274060] border border-gray-700 focus:border-[#6c84a2] focus:ring-1 focus:ring-[#6c84a2]"
                placeholder="Enter token name"
            />
        </div>
        <div>
            <label class="block text-sm font-medium mb-2">Token Decimals</label>
            <input 
                type="number"
                bind:value={data.token_decimals}
                class="w-full p-3 rounded-lg bg-[#274060] border border-gray-700 focus:border-[#6c84a2] focus:ring-1 focus:ring-[#6c84a2]"
                placeholder="e.g., 6"
            />
        </div>
    </div>

    <div>
        <label class="block text-sm font-medium mb-2">Token Description</label>
        <textarea 
            bind:value={data.token_description}
            class="w-full p-3 rounded-lg bg-[#274060] border border-gray-700 focus:border-[#6c84a2] focus:ring-1 focus:ring-[#6c84a2]"
            rows="3"
            placeholder="Describe your token"
        />
    </div>

    <div class="grid grid-cols-2 gap-6">
        <div>
            <label class="block text-sm font-medium mb-2">Total Supply</label>
            <input 
                type="number"
                bind:value={data.total_supply}
                class="w-full p-3 rounded-lg bg-[#274060] border border-gray-700 focus:border-[#6c84a2] focus:ring-1 focus:ring-[#6c84a2]"
                placeholder="Total token supply"
            />
        </div>
        <div>
            <label class="block text-sm font-medium mb-2">Initial LP %</label>
            <select 
                bind:value={data.liquidity_info}
                class="w-full p-3 rounded-lg bg-[#274060] border border-gray-700 focus:border-[#6c84a2] focus:ring-1 focus:ring-[#6c84a2]"
            >
                {#each lpOptions as option}
                    <option value={option}>{option}</option>
                {/each}
            </select>
        </div>
    </div>

    <div class="grid grid-cols-2 gap-6">
        <div>
            <label class="block text-sm font-medium mb-2">
                Target Amount ({data.base_name})
            </label>
            <input 
                type="number"
                bind:value={data.base_target_amount}
                class="w-full p-3 rounded-lg bg-[#274060] border border-gray-700 focus:border-[#6c84a2] focus:ring-1 focus:ring-[#6c84a2]"
                placeholder="Target raise amount"
            />
        </div>
        <div>
            <label class="block text-sm font-medium mb-2">LP Fee %</label>
            <input 
                type="number"
                bind:value={data.lp_fee}
                class="w-full p-3 rounded-lg bg-[#274060] border border-gray-700 focus:border-[#6c84a2] focus:ring-1 focus:ring-[#6c84a2]"
                placeholder="e.g., 3"
            />
        </div>
    </div>

    <div class="grid grid-cols-2 gap-6">
        <div>
            <label class="block text-sm font-medium mb-2">Min Contribution</label>
            <input 
                type="number"
                bind:value={data.min_contribution}
                class="w-full p-3 rounded-lg bg-[#274060] border border-gray-700 focus:border-[#6c84a2] focus:ring-1 focus:ring-[#6c84a2]"
                placeholder="Minimum contribution"
            />
        </div>
        <div>
            <label class="block text-sm font-medium mb-2">Max Contribution</label>
            <input 
                type="number"
                bind:value={data.max_contribution}
                class="w-full p-3 rounded-lg bg-[#274060] border border-gray-700 focus:border-[#6c84a2] focus:ring-1 focus:ring-[#6c84a2]"
                placeholder="Maximum contribution"
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