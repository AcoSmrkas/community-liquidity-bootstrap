<script lang="ts">
    import { fetchTokenInfo } from '$lib/utils/tokenUtils';
    import { selected_wallet, connected_wallet_address } from "$lib/store/store.ts";
    import { MEW_FEE_ADDRESS_ERGO } from '$lib/common/const.js';
    
    export let data = {
        recipient_address: MEW_FEE_ADDRESS_ERGO, // Set MEW fee address as recipient
        base_name: "ERG",
        base_token_id: null,
        base_decimals: 9,
        base_target_amount: 0,
        min_contribution: 0,
        max_contribution: 0,
        applicant: ""
    };

    let selectedBaseToken = 'ERG';
    let loadingTokenInfo = false;
    let tokenInfo = null;
    let useConnectedWallet = true; // New state for checkbox

    // Reactive statement to handle applicant address
    $: {
        if (useConnectedWallet) {
            data.applicant = $connected_wallet_address;
        }
    }

    async function handleBaseTokenChange(event: Event) {
        const value = (event.target as HTMLInputElement).value;
        selectedBaseToken = value;
        
        if (value === 'ERG') {
            data.base_name = 'ERG';
            data.base_token_id = null;
            data.base_decimals = 9;
            tokenInfo = null;
        } else {
            tokenInfo = null;
            data.base_token_id = null;
            data.base_name = "";
            data.base_decimals = 0;
        }
    }

    async function handleTokenIdInput(event: Event) {
        const tokenId = (event.target as HTMLInputElement).value.trim();
        
        if (tokenId && tokenId.length === 64) {
            loadingTokenInfo = true;
            const fetchedToken = await fetchTokenInfo(tokenId);
            loadingTokenInfo = false;
            
            if (fetchedToken) {
                tokenInfo = fetchedToken;
                data.base_name = fetchedToken.name;
                data.base_decimals = fetchedToken.decimals;
                data.base_token_id = tokenId;
            }
        }
    }

    function handleApplicantCheckbox() {
        useConnectedWallet = !useConnectedWallet;
        if (useConnectedWallet) {
            data.applicant = $connected_wallet_address;
        }
    }
</script>

<div class="space-y-6">
    <!-- Base Token Selection -->
    <div>
        <label class="block text-sm font-medium mb-2 text-[var(--main-color)]">Funding Token</label>
        <div class="flex gap-4 mb-4">
            <label class="flex items-center">
                <input
                    type="radio"
                    name="baseToken"
                    value="ERG"
                    checked={selectedBaseToken === 'ERG'}
                    on:change={handleBaseTokenChange}
                    class="mr-2"
                />
                <span class="text-[var(--text-primary)]">ERG</span>
            </label>
            <label class="flex items-center">
                <input
                    type="radio"
                    name="baseToken"
                    value="custom"
                    checked={selectedBaseToken === 'custom'}
                    on:change={handleBaseTokenChange}
                    class="mr-2"
                />
                <span class="text-[var(--text-primary)]">Custom Token</span>
            </label>
        </div>

        {#if selectedBaseToken === 'custom'}
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-2 text-[var(--main-color)]">Token ID</label>
                    <input 
                        type="text"
                        placeholder="Enter token ID"
                        on:input={handleTokenIdInput}
                        class="w-full p-3 rounded-lg bg-[var(--forms-bg)] border border-[var(--border-color)] 
                               focus:border-[var(--main-color)] focus:ring-1 focus:ring-[var(--main-color)] text-[var(--text-primary)]"
                    />
                </div>

                {#if loadingTokenInfo}
                    <div class="text-[var(--main-color)] text-sm">Loading token information...</div>
                {:else if tokenInfo}
                    <div class="bg-[var(--card-bg)] p-4 rounded-lg border border-[var(--border-color)]">
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
                    class="form-checkbox rounded text-[var(--main-color)]"
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

    <!-- Target Amount -->
    <div>
        <label class="block text-sm font-medium mb-2 text-[var(--main-color)]">
            Target Amount ({data.base_name})
        </label>
        <input 
            type="number" 
            bind:value={data.base_target_amount}
            class="w-full p-3 rounded-lg bg-[var(--forms-bg)] border border-[var(--border-color)] 
                   focus:border-[var(--main-color)] focus:ring-1 focus:ring-[var(--main-color)] text-[var(--text-primary)]"
            placeholder="Total amount to raise"
        />
    </div>

    <!-- Contribution Limits -->
    <div class="grid grid-cols-2 gap-6">
        <div>
            <label class="block text-sm font-medium mb-2 text-[var(--main-color)]">
                Min Contribution ({data.base_name})
            </label>
            <input 
                type="number" 
                bind:value={data.min_contribution}
                class="w-full p-3 rounded-lg bg-[var(--forms-bg)] border border-[var(--border-color)] 
                       focus:border-[var(--main-color)] focus:ring-1 focus:ring-[var(--main-color)] text-[var(--text-primary)]"
                placeholder="Minimum amount per user"
            />
        </div>
        <div>
            <label class="block text-sm font-medium mb-2 text-[var(--main-color)]">
                Max Contribution ({data.base_name})
            </label>
            <input 
                type="number"
                bind:value={data.max_contribution}
                class="w-full p-3 rounded-lg bg-[var(--forms-bg)] border border-[var(--border-color)] 
                       focus:border-[var(--main-color)] focus:ring-1 focus:ring-[var(--main-color)] text-[var(--text-primary)]"
                placeholder="Maximum amount per user"
            />
        </div>
    </div>

      <!-- Info Card at the bottom -->
      <div class="bg-[var(--card-bg)] p-4 rounded-lg border border-[var(--border-color)]">
        <div class="flex items-start gap-3">
            <div class="p-2 bg-[var(--forms-bg)] rounded-lg">
                <svg class="w-5 h-5 text-[var(--main-color)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <div>
                <h3 class="font-medium mb-1 text-[var(--text-primary)]">Crowdfunding Campaign</h3>
                <p class="text-sm text-[var(--text-secondary)]">
                    {selectedBaseToken === 'ERG' 
                        ? 'Raise ERG tokens with customizable contribution limits.' 
                        : 'Raise custom tokens with customizable contribution limits.'}
                </p>
                <p class="text-sm text-[var(--text-secondary)] mt-2">
                    Campaign funds will be sent to Mew fee address.
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
    input[type="radio"] {
        appearance: none;
        width: 1.2rem;
        height: 1.2rem;
        border: 2px solid var(--main-color);
        border-radius: 50%;
        background-clip: content-box;
        padding: 3px;
    }
    input[type="radio"]:checked {
        background-color: var(--main-color);
        border-color: var(--main-color);
    }

    /* Placeholder styling */
    ::placeholder {
        color: var(--text-secondary);
        opacity: 0.7;
    }
    /* Add checkbox styling */
    .form-checkbox {
        @apply h-4 w-4 text-[var(--main-color)] border-[var(--border-color)] rounded focus:ring-[var(--main-color)];
    }
</style>