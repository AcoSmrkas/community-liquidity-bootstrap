<script lang="ts">
    import { fetchTokenInfo } from '$lib/utils/tokenUtils';
    import { selected_wallet, connected_wallet_address } from "$lib/store/store.ts";

    export let data = {
        // ERG (base) settings
        base_name: "ERG",  // Always ERG
        base_token_id: null,  // Always null for ERG
        base_decimals: 9,  // Always 9 for ERG
        base_target_amount: 0,
        min_contribution: 0,
        max_contribution: 0,
        
        // Token settings
        token_id: null,
        token_name: "",
        token_decimals: 0,
        token_target_amount: 0,
        min_token: 0,
        max_token: 0,
        token_description: "",
        
        // LP settings
        liquidity_info: "100%",
        lp_fee: 3,
        
        // System fields
        applicant: $connected_wallet_address,
        status_phase: "inactive"
    };

    let loadingTokenInfo = false;
    let tokenInfo = null;
    let useConnectedWallet = true;

    // Reactive statement to handle applicant address
    $: {
        if (useConnectedWallet) {
            data.applicant = $connected_wallet_address;
        }
        console.log("Current applicant:", data.applicant);
    }

    async function handleTokenIdInput(event: Event) {
        const tokenId = (event.target as HTMLInputElement).value.trim();
        console.log("Token Input:", tokenId);
        
        if (tokenId && tokenId.length === 64) {
            loadingTokenInfo = true;
            const fetchedToken = await fetchTokenInfo(tokenId);
            loadingTokenInfo = false;
            
            if (fetchedToken) {
                console.log("Token Info Fetched:", fetchedToken);
                tokenInfo = fetchedToken;
                data.token_id = tokenId;
                data.token_name = fetchedToken.name;
                data.token_decimals = fetchedToken.decimals;
            }
        }
    }

    function handleApplicantCheckbox() {
        useConnectedWallet = !useConnectedWallet;
        if (useConnectedWallet) {
            data.applicant = $connected_wallet_address;
        } else {
            data.applicant = ""; // Clear the applicant when unchecking
        }
    }
</script>

<div class="space-y-6">
    <!-- Token Selection -->
    <div>
        <label class="block text-sm font-medium mb-2 text-[var(--main-color)]">
            Token ID
            <span class="text-red-400 ml-1">*</span>
        </label>
        <input 
            type="text"
            placeholder="Enter token ID"
            on:input={handleTokenIdInput}
            class="w-full p-3 rounded-lg bg-[var(--forms-bg)] border border-[var(--border-color)] 
                   focus:border-[var(--main-color)] focus:ring-1 focus:ring-[var(--main-color)] text-[var(--text-primary)]"
        />
        
        {#if loadingTokenInfo}
            <div class="mt-2 text-[var(--main-color)] text-sm">Loading token information...</div>
        {:else if tokenInfo}
            <div class="mt-3 bg-[var(--card-bg)] p-4 rounded-lg border border-[var(--border-color)]">
                <h4 class="text-sm font-medium mb-2 text-[var(--main-color)]">Token Information</h4>
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

    <!-- Applicant Address Section -->
    <div>
        <label class="block text-sm font-medium mb-2 text-[var(--main-color)]">Applicant Address</label>
        <div class="space-y-3">
            <label class="flex items-center space-x-2">
                <input
                    type="checkbox"
                    checked={useConnectedWallet}
                    on:change={handleApplicantCheckbox}
                    class="form-checkbox h-4 w-4 text-[var(--main-color)] border-[var(--border-color)] rounded"
                />
                <span class="text-[var(--text-primary)]">Use connected wallet address</span>
            </label>
            
            <input 
                type="text" 
                bind:value={data.applicant}
                disabled={useConnectedWallet}
                class="w-full p-3 rounded-lg bg-[var(--forms-bg)] border border-[var(--border-color)] 
                       focus:border-[var(--main-color)] focus:ring-1 focus:ring-[var(--main-color)] text-[var(--text-primary)]
                       disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder={useConnectedWallet ? "Using connected wallet address" : "Enter applicant address"}
            />
        </div>
    </div>

    <!-- Target Amounts -->
    <div class="grid grid-cols-2 gap-6">
        <div>
            <label class="block text-sm font-medium mb-2 text-[var(--main-color)]">
                ERG Target Amount
            </label>
            <input 
                type="number"
                bind:value={data.base_target_amount}
                class="w-full p-3 rounded-lg bg-[var(--forms-bg)] border border-[var(--border-color)] 
                       focus:border-[var(--main-color)] focus:ring-1 focus:ring-[var(--main-color)] text-[var(--text-primary)]"
                placeholder="ERG amount"
            />
        </div>
        <div>
            <label class="block text-sm font-medium mb-2 text-[var(--main-color)]">
                Token Target Amount {tokenInfo?.name ? `(${tokenInfo.name})` : ''}
            </label>
            <input 
                type="number"
                bind:value={data.token_target_amount}
                class="w-full p-3 rounded-lg bg-[var(--forms-bg)] border border-[var(--border-color)] 
                       focus:border-[var(--main-color)] focus:ring-1 focus:ring-[var(--main-color)] text-[var(--text-primary)]"
                placeholder="Token amount"
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

    <!-- ERG Contribution Limits -->
    <div class="grid grid-cols-2 gap-6">
        <div>
            <label class="block text-sm font-medium mb-2 text-[var(--main-color)]">
                Min ERG Contribution
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
                Max ERG Contribution
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

    <!-- Token Contribution Limits -->
    <div class="grid grid-cols-2 gap-6">
        <div>
            <label class="block text-sm font-medium mb-2 text-[var(--main-color)]">
                Min Token Contribution {tokenInfo?.name ? `(${tokenInfo.name})` : ''}
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
                Max Token Contribution {tokenInfo?.name ? `(${tokenInfo.name})` : ''}
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
                <svg class="w-10 h-10 text-[var(--main-color)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <div>
                <h3 class="font-medium mb-1 text-[var(--text-primary)]">ERG/Asset LP Campaign</h3>
                <p class="text-sm text-[var(--text-secondary)]">
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
    
    /* Checkbox styling */
    input[type="checkbox"] {
        appearance: none;
        padding: 0;
        -webkit-print-color-adjust: exact;
        color-adjust: exact;
        display: inline-block;
        vertical-align: middle;
        background-origin: border-box;
        user-select: none;
        flex-shrink: 0;
        background-color: var(--forms-bg);
        border: 2px solid var(--main-color);
    }

    input[type="checkbox"]:checked {
        background-color: var(--main-color);
        border-color: var(--main-color);
        background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e");
    }

    /* Placeholder styling */
    ::placeholder {
        color: var(--text-secondary);
        opacity: 0.7;
    }
</style>