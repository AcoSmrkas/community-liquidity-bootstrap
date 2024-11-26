<script lang="ts">
    export let data = {
        base_name: "ERG",
        base_target_amount: 0,
        secondary_token_id: null,
        secondary_token_name: "",
        secondary_token_decimals: 0,
        secondary_token_amount: 0,
        liquidity_info: "100%",
        lp_fee: 3,
        min_contribution: 0,
        max_contribution: 0
    };

    const lpOptions = ["100%", "75%", "50%"];

    async function handleTokenIdInput(event: Event) {
        const tokenId = (event.target as HTMLInputElement).value.trim();
        if (tokenId && tokenId.length === 64) {
            // Here you would normally fetch token info
            console.log('Fetching token info for:', tokenId);
            // For now, just update the ID
            data.secondary_token_id = tokenId;
        }
    }
</script>

<div class="space-y-6">
    <!-- Token Selection -->
    <div>
        <label class="block text-sm font-medium mb-2">Token ID</label>
        <input 
            type="text"
            placeholder="Enter token ID"
            on:input={handleTokenIdInput}
            class="w-full p-3 rounded-lg bg-[#274060] border border-gray-700 focus:border-[#6c84a2] focus:ring-1 focus:ring-[#6c84a2]"
        />
        
        {#if data.secondary_token_name}
            <div class="mt-3 bg-[#1b2845] p-4 rounded-lg border border-gray-700">
                <h4 class="text-sm font-medium mb-2">Token Info</h4>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span class="text-gray-400">Name:</span>
                        <span class="ml-2">{data.secondary_token_name}</span>
                    </div>
                    <div>
                        <span class="text-gray-400">Decimals:</span>
                        <span class="ml-2">{data.secondary_token_decimals}</span>
                    </div>
                </div>
            </div>
        {/if}
    </div>

    <!-- Target Amounts -->
    <div class="grid grid-cols-2 gap-6">
        <div>
            <label class="block text-sm font-medium mb-2">
                ERG Target Amount
            </label>
            <input 
                type="number"
                bind:value={data.base_target_amount}
                class="w-full p-3 rounded-lg bg-[#274060] border border-gray-700 focus:border-[#6c84a2] focus:ring-1 focus:ring-[#6c84a2]"
                placeholder="ERG amount"
            />
        </div>
        <div>
            <label class="block text-sm font-medium mb-2">
                Token Target Amount
            </label>
            <input 
                type="number"
                bind:value={data.secondary_token_amount}
                class="w-full p-3 rounded-lg bg-[#274060] border border-gray-700 focus:border-[#6c84a2] focus:ring-1 focus:ring-[#6c84a2]"
                placeholder="Token amount"
            />
        </div>
    </div>

    <!-- LP Settings -->
    <div class="grid grid-cols-2 gap-6">
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

    <!-- Contribution Limits -->
    <div class="grid grid-cols-2 gap-6">
        <div>
            <label class="block text-sm font-medium mb-2">Min Contribution (ERG)</label>
            <input 
                type="number"
                bind:value={data.min_contribution}
                class="w-full p-3 rounded-lg bg-[#274060] border border-gray-700 focus:border-[#6c84a2] focus:ring-1 focus:ring-[#6c84a2]"
                placeholder="Minimum"
            />
        </div>
        <div>
            <label class="block text-sm font-medium mb-2">Max Contribution (ERG)</label>
            <input 
                type="number"
                bind:value={data.max_contribution}
                class="w-full p-3 rounded-lg bg-[#274060] border border-gray-700 focus:border-[#6c84a2] focus:ring-1 focus:ring-[#6c84a2]"
                placeholder="Maximum"
            />
        </div>
    </div>

    <!-- Info Card -->
    <div class="bg-[#1b2845] p-4 rounded-lg border border-gray-700">
        <div class="flex items-start gap-3">
            <div class="p-2 bg-[#274060] rounded-lg">
                <svg class="w-5 h-5 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <div>
                <h3 class="font-medium mb-1">ERG Asset LP Campaign</h3>
                <p class="text-sm text-gray-400">
                    A liquidity pool will be created with ERG and your selected token after the campaign ends.
                </p>
            </div>
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