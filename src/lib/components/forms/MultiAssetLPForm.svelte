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
        
        // Second Token Fields (using exact schema names)
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

    // Add validation state tracking
    let baseTokenError = false;
    let tokenError = false;

    // Watch for changes in token IDs
    $: {
        console.log("Token State:", {
            base_token_id: data.base_token_id,
            token_id: data.token_id,
            baseTokenError,
            tokenError
        });
    }

    async function handleBaseTokenIdInput(event: Event) {
        const tokenId = (event.target as HTMLInputElement).value.trim();
        baseTokenError = !tokenId;
        
        if (tokenId && tokenId.length === 64) {
            loadingBaseTokenInfo = true;
            const fetchedToken = await fetchTokenInfo(tokenId);
            loadingBaseTokenInfo = false;
            
            if (fetchedToken) {
                baseTokenInfo = fetchedToken;
                data.base_token_id = tokenId; // Set this first
                data.base_name = fetchedToken.name;
                data.base_decimals = fetchedToken.decimals;
                baseTokenError = false;
            } else {
                baseTokenError = true;
            }
        }
    }

    async function handleTokenIdInput(event: Event) {
        const tokenId = (event.target as HTMLInputElement).value.trim();
        tokenError = !tokenId;
        
        if (tokenId && tokenId.length === 64) {
            loadingTokenInfo = true;
            const fetchedToken = await fetchTokenInfo(tokenId);
            loadingTokenInfo = false;
            
            if (fetchedToken) {
                tokenInfo = fetchedToken;
                // Important: Set token_id before other fields
                data.token_id = tokenId;
                data.token_name = fetchedToken.name;
                data.token_decimals = fetchedToken.decimals;
                tokenError = false;
                
                console.log("Token set successfully:", {
                    token_id: data.token_id,
                    token_name: data.token_name,
                    token_decimals: data.token_decimals
                });
            } else {
                tokenError = true;
            }
        }
    }

    // Validate required fields
    $: isValid = data.base_token_id && data.token_id;
</script>

<div class="space-y-6">
    <!-- Base Token Selection -->
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
        {#if baseTokenError}
            <p class="mt-1 text-sm text-red-400">First token ID is required</p>
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
        {#if tokenError}
            <p class="mt-1 text-sm text-red-400">Second token ID is required</p>
        {/if}
    </div>

    <!-- Target Amounts -->
    <div class="grid grid-cols-2 gap-6">
        <div>
            <label class="block text-sm font-medium mb-2 text-[var(--main-color)]">
                First Token Target Amount {baseTokenInfo?.name ? `(${baseTokenInfo.name})` : ''}
                <span class="text-red-400 ml-1">*</span>
            </label>
            <input 
                type="number"
                bind:value={data.base_target_amount}
                class="w-full p-3 rounded-lg bg-[var(--forms-bg)] border border-[var(--border-color)] 
                       focus:border-[var(--main-color)] focus:ring-1 focus:ring-[var(--main-color)] text-[var(--text-primary)]"
                placeholder="First token amount"
                required
            />
        </div>
        <div>
            <label class="block text-sm font-medium mb-2 text-[var(--main-color)]">
                Second Token Target Amount {tokenInfo?.name ? `(${tokenInfo.name})` : ''}
                <span class="text-red-400 ml-1">*</span>
            </label>
            <input 
                type="number"
                bind:value={data.token_target_amount}
                class="w-full p-3 rounded-lg bg-[var(--forms-bg)] border border-[var(--border-color)] 
                       focus:border-[var(--main-color)] focus:ring-1 focus:ring-[var(--main-color)] text-[var(--text-primary)]"
                placeholder="Second token amount"
                required
            />
        </div>
    </div>

    <!-- Rest of your form remains the same -->
    <!-- LP Settings, contribution limits, etc. -->

    <!-- Info Card with validation status -->
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
                    Both tokens are required to create the liquidity pool.
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