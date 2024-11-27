<script lang="ts">
    import { fetchTokenInfo } from '$lib/utils/tokenUtils';
    import { selected_wallet, connected_wallet_address } from "$lib/store/store.ts";

    export let data = {
        // First Token Fields
        base_token_id: null,
        base_name: "",
        base_decimals: 0,
        base_target_amount: 0,
        min_contribution: 0,
        max_contribution: 0,
        base_icon_url: "",
        
        // Second Token Fields
        token_id: null,
        token_name: "",
        token_decimals: 0,
        token_target_amount: 0,
        min_token: 0,
        max_token: 0,
        token_icon_url: "",
        token_description: "",
        
        // LP Settings
        liquidity_info: "100%",
        lp_fee: 3,
        
        // System fields
        applicant: $selected_wallet,
        status_phase: "inactive"
    };

    let loadingBaseTokenInfo = false;
    let loadingTokenInfo = false;
    let baseTokenInfo = null;
    let tokenInfo = null;
    let baseTokenError = false;
    let tokenError = false;

    let useConnectedWallet = true;

    // Add reactive statement to ensure applicant is always set
    $: {
        if (useConnectedWallet) {
            data.applicant = $connected_wallet_address;
        }
        console.log("Current applicant:", data.applicant);
    }
$: isTokensValid = data.base_token_id && data.token_id;
async function handleBaseTokenIdInput(event: Event) {
    const tokenId = (event.target as HTMLInputElement).value.trim();
    
    if (!tokenId || tokenId.length !== 64) {
        baseTokenError = true;
        data.base_token_id = null;  // Clear invalid token ID
        return;
    }
    
    loadingBaseTokenInfo = true;
    const fetchedToken = await fetchTokenInfo(tokenId);
    loadingBaseTokenInfo = false;
    
    if (fetchedToken) {
        baseTokenInfo = fetchedToken;
        data.base_name = fetchedToken.name;
        data.base_decimals = fetchedToken.decimals;
        data.base_token_id = tokenId;  // Set valid token ID
        baseTokenError = false;
    } else {
        baseTokenError = true;
        data.base_token_id = null;  // Clear invalid token ID
    }
}

async function handleTokenIdInput(event: Event) {
    const tokenId = (event.target as HTMLInputElement).value.trim();
    
    if (!tokenId || tokenId.length !== 64) {
        tokenError = true;
        data.token_id = null;  // Clear invalid token ID
        return;
    }
    
    loadingTokenInfo = true;
    const fetchedToken = await fetchTokenInfo(tokenId);
    loadingTokenInfo = false;
    
    if (fetchedToken) {
        tokenInfo = fetchedToken;
        data.token_name = fetchedToken.name;
        data.token_decimals = fetchedToken.decimals;
        data.token_id = tokenId;  // Set valid token ID
        tokenError = false;
    } else {
        tokenError = true;
        data.token_id = null;  // Clear invalid token ID
    }
}
</script>

<div class="space-y-6">
    <!-- First Token Selection -->
    <div>
        <label class="block text-sm font-medium mb-2 text-[var(--main-color)]">
            First Token ID
            <span class="text-red-400 ml-1">*</span>
        </label>
        <input 
            type="text"
            placeholder="Enter first token ID (required)"
            on:input={handleBaseTokenIdInput}
            class="w-full p-3 rounded-lg bg-[var(--forms-bg)] border 
                   {baseTokenError ? 'border-red-500' : 'border-[var(--border-color)]'}
                   focus:border-[var(--main-color)] focus:ring-1 focus:ring-[var(--main-color)] text-[var(--text-primary)]"
            required
        />
        {#if baseTokenError}
            <p class="mt-1 text-sm text-red-400">First token ID is required</p>
        {/if}
        
        {#if loadingBaseTokenInfo}
            <div class="mt-2 text-[var(--main-color)] text-sm">Loading token information...</div>
        {:else if baseTokenInfo}
            <div class="mt-3 bg-[var(--card-bg)] p-4 rounded-lg border border-[var(--border-color)]">
                <h4 class="text-sm font-medium mb-2 text-[var(--main-color)]">First Token Info</h4>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span class="text-[var(--text-secondary)]">Name:</span>
                        <span class="ml-2 text-[var(--text-primary)]">{baseTokenInfo.name}</span>
                    </div>
                    <div>
                        <span class="text-[var(--text-secondary)]">Decimals:</span>
                        <span class="ml-2 text-[var(--text-primary)]">{baseTokenInfo.decimals}</span>
                    </div>
                </div>
            </div>
        {/if}
    </div>

    <!-- Second Token Selection -->
    <div>
        <label class="block text-sm font-medium mb-2 text-[var(--main-color)]">
            Second Token ID
            <span class="text-red-400 ml-1">*</span>
        </label>
        <input 
            type="text"
            placeholder="Enter second token ID (required)"
            on:input={handleTokenIdInput}
            class="w-full p-3 rounded-lg bg-[var(--forms-bg)] border 
                   {tokenError ? 'border-red-500' : 'border-[var(--border-color)]'}
                   focus:border-[var(--main-color)] focus:ring-1 focus:ring-[var(--main-color)] text-[var(--text-primary)]"
            required
        />
        {#if tokenError}
            <p class="mt-1 text-sm text-red-400">Second token ID is required</p>
        {/if}
        
        {#if loadingTokenInfo}
            <div class="mt-2 text-[var(--main-color)] text-sm">Loading token information...</div>
        {:else if tokenInfo}
            <div class="mt-3 bg-[var(--card-bg)] p-4 rounded-lg border border-[var(--border-color)]">
                <h4 class="text-sm font-medium mb-2 text-[var(--main-color)]">Second Token Info</h4>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span class="text-[var(--text-secondary)]">Name:</span>
                        <span class="ml-2 text-[var(--text-primary)]">{tokenInfo.name}</span>
                    </div>
                    <div>
                        <span class="text-[var(--text-secondary)]">Decimals:</span>
                        <span class="ml-2 text-[var(--text-primary)]">{tokenInfo.decimals}</span>
                    </div>
                </div>
            </div>
        {/if}
    </div>

    <!-- Target Amounts -->
    <div class="grid grid-cols-2 gap-6">
        <div>
            <label class="block text-sm font-medium mb-2 text-[var(--main-color)]">
                First Token Target Amount {baseTokenInfo?.name ? `(${baseTokenInfo.name})` : ''}
            </label>
            <input 
                type="number"
                bind:value={data.base_target_amount}
                class="w-full p-3 rounded-lg bg-[var(--forms-bg)] border border-[var(--border-color)] 
                       focus:border-[var(--main-color)] focus:ring-1 focus:ring-[var(--main-color)] text-[var(--text-primary)]"
                placeholder="First token amount"
            />
        </div>
        <div>
            <label class="block text-sm font-medium mb-2 text-[var(--main-color)]">
                Second Token Target Amount {tokenInfo?.name ? `(${tokenInfo.name})` : ''}
            </label>
            <input 
                type="number"
                bind:value={data.token_target_amount}
                class="w-full p-3 rounded-lg bg-[var(--forms-bg)] border border-[var(--border-color)] 
                       focus:border-[var(--main-color)] focus:ring-1 focus:ring-[var(--main-color)] text-[var(--text-primary)]"
                placeholder="Second token amount"
            />
        </div>
    </div>

    <!-- LP Settings -->
    <div class="grid grid-cols-2 gap-6">
        <div>
            <label class="block text-sm font-medium mb-2 text-[var(--main-color)]">Initial LP %</label>
            <select 
                bind:value={data.liquidity_info}
                class="w-full p-3 rounded-lg bg-[var(--forms-bg)] border border-[var(--border-color)] 
                       focus:border-[var(--main-color)] focus:ring-1 focus:ring-[var(--main-color)] text-[var(--text-primary)]"
            >
                <option value="100%">100%</option>
                <option value="75%">75%</option>
                <option value="50%">50%</option>
            </select>
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

    <!-- First Token Contribution Limits -->
    <div class="grid grid-cols-2 gap-6">
        <div>
            <label class="block text-sm font-medium mb-2 text-[var(--main-color)]">
                Min First Token Contribution {baseTokenInfo?.name ? `(${baseTokenInfo.name})` : ''}
            </label>
            <input 
                type="number"
                bind:value={data.min_contribution}
                class="w-full p-3 rounded-lg bg-[var(--forms-bg)] border border-[var(--border-color)] 
                       focus:border-[var(--main-color)] focus:ring-1 focus:ring-[var(--main-color)] text-[var(--text-primary)]"
                placeholder="Minimum"
            />
        </div>
        <div>
            <label class="block text-sm font-medium mb-2 text-[var(--main-color)]">
                Max First Token Contribution {baseTokenInfo?.name ? `(${baseTokenInfo.name})` : ''}
            </label>
            <input 
                type="number"
                bind:value={data.max_contribution}
                class="w-full p-3 rounded-lg bg-[var(--forms-bg)] border border-[var(--border-color)] 
                       focus:border-[var(--main-color)] focus:ring-1 focus:ring-[var(--main-color)] text-[var(--text-primary)]"
                placeholder="Maximum"
            />
        </div>
    </div>

    <!-- Second Token Contribution Limits -->
    <div class="grid grid-cols-2 gap-6">
        <div>
            <label class="block text-sm font-medium mb-2 text-[var(--main-color)]">
                Min Second Token Contribution {tokenInfo?.name ? `(${tokenInfo.name})` : ''}
            </label>
            <input 
                type="number"
                bind:value={data.min_token}
                class="w-full p-3 rounded-lg bg-[var(--forms-bg)] border border-[var(--border-color)] 
                       focus:border-[var(--main-color)] focus:ring-1 focus:ring-[var(--main-color)] text-[var(--text-primary)]"
                placeholder="Minimum"
            />
        </div>
        <div>
            <label class="block text-sm font-medium mb-2 text-[var(--main-color)]">
                Max Second Token Contribution {tokenInfo?.name ? `(${tokenInfo.name})` : ''}
            </label>
            <input 
                type="number"
                bind:value={data.max_token}
                class="w-full p-3 rounded-lg bg-[var(--forms-bg)] border border-[var(--border-color)] 
                       focus:border-[var(--main-color)] focus:ring-1 focus:ring-[var(--main-color)] text-[var(--text-primary)]"
                placeholder="Maximum"
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
                <h3 class="font-medium mb-1 text-[var(--text-primary)]">Token/Token LP Campaign</h3>
                <p class="text-sm text-[var(--text-secondary)]">
                    A liquidity pool will be created with your selected tokens after the campaign ends.
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