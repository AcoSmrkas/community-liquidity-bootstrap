<script lang="ts">
    import { selected_wallet, connected_wallet_address } from "$lib/store/store.ts";

    export let data = {
        // Campaign specific fields
        mint_new_token: "t",
        base_name: "ERG",  // Always ERG for mint+lp
        base_decimals: 9,  // Always 9 for ERG
        base_target_amount: 0,
        min_contribution: 0,
        max_contribution: 0,
        
        // Token specific fields
        token_name: "",
        token_description: "",
        token_decimals: 0,
        total_supply: 0,
        
        // LP specific fields
        liquidity_info: "100%",
        lp_fee: 3,
        
        // System fields
        applicant: $connected_wallet_address,
        status_phase: "inactive"
    };

    const lpOptions = ["100%", "75%", "50%"];
</script>

<div class="space-y-6">
    <!-- Token Configuration -->
    <div class="grid grid-cols-2 gap-6">
        <div>
            <label class="block text-sm font-medium mb-2 text-[var(--main-color)]">Token Name</label>
            <input 
                type="text" 
                bind:value={data.token_name}
                class="w-full p-3 rounded-lg bg-[var(--forms-bg)] border border-[var(--border-color)] 
                       focus:border-[var(--main-color)] focus:ring-1 focus:ring-[var(--main-color)] text-[var(--text-primary)]"
                placeholder="Enter new token name"
            />
        </div>
        <div>
            <label class="block text-sm font-medium mb-2 text-[var(--main-color)]">Token Decimals</label>
            <input 
                type="number"
                bind:value={data.token_decimals}
                class="w-full p-3 rounded-lg bg-[var(--forms-bg)] border border-[var(--border-color)] 
                       focus:border-[var(--main-color)] focus:ring-1 focus:ring-[var(--main-color)] text-[var(--text-primary)]"
                placeholder="e.g., 6"
            />
        </div>
    </div>

    <!-- Token Description -->
    <div>
        <label class="block text-sm font-medium mb-2 text-[var(--main-color)]">Token Description</label>
        <textarea 
            bind:value={data.token_description}
            class="w-full p-3 rounded-lg bg-[var(--forms-bg)] border border-[var(--border-color)] 
                   focus:border-[var(--main-color)] focus:ring-1 focus:ring-[var(--main-color)] text-[var(--text-primary)]"
            rows="3"
            placeholder="Describe your token"
        />
    </div>

    <!-- Supply and LP Settings -->
    <div class="grid grid-cols-2 gap-6">
        <div>
            <label class="block text-sm font-medium mb-2 text-[var(--main-color)]">Total Token Supply</label>
            <input 
                type="number"
                bind:value={data.total_supply}
                class="w-full p-3 rounded-lg bg-[var(--forms-bg)] border border-[var(--border-color)] 
                       focus:border-[var(--main-color)] focus:ring-1 focus:ring-[var(--main-color)] text-[var(--text-primary)]"
                placeholder="Total amount to mint"
            />
        </div>
        <div>
            <label class="block text-sm font-medium mb-2 text-[var(--main-color)]">Initial LP %</label>
            <select 
                bind:value={data.liquidity_info}
                class="w-full p-3 rounded-lg bg-[var(--forms-bg)] border border-[var(--border-color)] 
                       focus:border-[var(--main-color)] focus:ring-1 focus:ring-[var(--main-color)] text-[var(--text-primary)]"
            >
                {#each lpOptions as option}
                    <option value={option}>{option}</option>
                {/each}
            </select>
        </div>
    </div>

    <!-- ERG Target Amount and LP Fee -->
    <div class="grid grid-cols-2 gap-6">
        <div>
            <label class="block text-sm font-medium mb-2 text-[var(--main-color)]">ERG Target Amount</label>
            <input 
                type="number"
                bind:value={data.base_target_amount}
                class="w-full p-3 rounded-lg bg-[var(--forms-bg)] border border-[var(--border-color)] 
                       focus:border-[var(--main-color)] focus:ring-1 focus:ring-[var(--main-color)] text-[var(--text-primary)]"
                placeholder="Amount of ERG for LP"
            />
        </div>
        <div>
            <label class="block text-sm font-medium mb-2 text-[var(--main-color)]">LP Fee %</label>
            <input 
                type="number"
                bind:value={data.lp_fee}
                class="w-full p-3 rounded-lg bg-[var(--forms-bg)] border border-[var(--border-color)] 
                       focus:border-[var(--main-color)] focus:ring-1 focus:ring-[var(--main-color)] text-[var(--text-primary)]"
                placeholder="e.g., 3"
            />
        </div>
    </div>

    <!-- Contribution Limits -->
    <div class="grid grid-cols-2 gap-6">
        <div>
            <label class="block text-sm font-medium mb-2 text-[var(--main-color)]">Min Contribution (ERG)</label>
            <input 
                type="number"
                bind:value={data.min_contribution}
                class="w-full p-3 rounded-lg bg-[var(--forms-bg)] border border-[var(--border-color)] 
                       focus:border-[var(--main-color)] focus:ring-1 focus:ring-[var(--main-color)] text-[var(--text-primary)]"
                placeholder="Minimum ERG contribution"
            />
        </div>
        <div>
            <label class="block text-sm font-medium mb-2 text-[var(--main-color)]">Max Contribution (ERG)</label>
            <input 
                type="number"
                bind:value={data.max_contribution}
                class="w-full p-3 rounded-lg bg-[var(--forms-bg)] border border-[var(--border-color)] 
                       focus:border-[var(--main-color)] focus:ring-1 focus:ring-[var(--main-color)] text-[var(--text-primary)]"
                placeholder="Maximum ERG contribution"
            />
        </div>
    </div>

    <!-- Info Card -->
    <div class="bg-[var(--card-bg)] p-4 rounded-lg border border-[var(--border-color)]">
        <div class="flex items-start gap-3">
            <div class="p-2 bg-[var(--forms-bg)] rounded-lg">
                <svg class="w-5 h-5 text-[var(--main-color)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <div>
                <h3 class="font-medium mb-1 text-[var(--text-primary)]">Token Mint + LP Campaign</h3>
                <p class="text-sm text-[var(--text-secondary)]">
                    Your token will be minted and paired with ERG in a liquidity pool automatically after the campaign ends.
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

    /* Placeholder styling */
    ::placeholder {
        color: var(--text-secondary);
        opacity: 0.7;
    }
</style>