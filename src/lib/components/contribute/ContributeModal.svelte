<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { MEW_FEE_PERCENTAGE } from '$lib/common/const.js';
    import { BigNumber } from 'bignumber.js';
    import { nFormatter } from '$lib/utils/utils.js';
    import { selected_wallet, connected_wallet_address } from "$lib/store/store.ts";
    
    export let campaign;
    export let onClose;
    export let showErgopayModal;
    export let isAuth;
    export let unsignedTx;
    export let loading = false;
    export let campaignBalances = {};

    const dispatch = createEventDispatcher();

    let selectedAsset = null;
    let amount = '';
    let step = 'select';
    let userBalances = { ERG: 0, tokens: {} };
    let balanceLoading = false;
    let balanceError = null;

    // Function to fetch user balances
    async function fetchUserBalances() {
        if (!$connected_wallet_address) return;
        
        balanceLoading = true;
        balanceError = null;
        
        try {
            const response = await fetch(`https://api.ergoplatform.com/api/v1/addresses/${$connected_wallet_address}/balance/total`);
            if (!response.ok) throw new Error('Failed to fetch balance');
            
            const data = await response.json();
            
            // Process ERG balance (convert from nanoERG to ERG)
            userBalances.ERG = new BigNumber(data.confirmed.nanoErgs)
                .dividedBy(Math.pow(10, 9))
                .toNumber();
            
            // Process token balances
            userBalances.tokens = data.confirmed.tokens.reduce((acc, token) => {
                acc[token.tokenId] = {
                    amount: new BigNumber(token.amount)
                        .dividedBy(Math.pow(10, token.decimals))
                        .toNumber(),
                    name: token.name,
                    decimals: token.decimals
                };
                return acc;
            }, {});
        } catch (error) {
            console.error('Error fetching balances:', error);
            balanceError = 'Failed to load balances';
        } finally {
            balanceLoading = false;
        }
    }

    // Fetch balances when component mounts or wallet changes
    $: if ($connected_wallet_address) {
        fetchUserBalances();
    }

    function getCurrentBalance(isBaseToken) {
        if (!$connected_wallet_address) return 0;
        
        if (campaign.base_name === 'ERG' && isBaseToken) {
            return userBalances.ERG;
        }
        
        const tokenId = isBaseToken ? campaign.base_token_id : campaign.token_id;
        return userBalances.tokens[tokenId]?.amount || 0;
    }

    function getMinContribution(isBaseToken) {
        return isBaseToken ? campaign.min_contribution : campaign.min_token;
    }

    function getMaxContribution(isBaseToken) {
        return isBaseToken ? campaign.max_contribution : campaign.max_token;
    }

    // Helper function to generate swap URL
    function getSwapUrl(isBaseToken) {
        const baseTokenId = "0000000000000000000000000000000000000000000000000000000000000000"; // ERG token ID
        if (campaign.base_name === 'ERG' && isBaseToken) {
            return "https://dex.mewfinance.com/ergo/swap"; // Just ERG swap page if they need ERG
        }
        
        const tokenId = isBaseToken ? campaign.base_token_id : campaign.token_id;
        return `https://dex.mewfinance.com/ergo/swap?base=${baseTokenId}&quote=${tokenId}`;
    }

    // Helper function to check if user has sufficient balance
    function hasSufficientBalance(isBaseToken) {
        const currentBalance = getCurrentBalance(isBaseToken);
        return currentBalance > 0;
    }

    function selectAsset(isBaseToken) {
        if (isBaseToken) {
            if (campaign.base_name === 'ERG') {
                selectedAsset = {
                    name: 'ERG',
                    tokenId: null,
                    icon: "https://spectrum.fi/logos/ergo/0000000000000000000000000000000000000000000000000000000000000000.svg",
                    decimals: campaign.base_decimals
                };
            } else {
                selectedAsset = {
                    name: campaign.base_name,
                    tokenId: campaign.base_token_id,
                    icon: campaign.base_icon_url || "https://raw.githubusercontent.com/spectrum-finance/token-logos/master/logos/ada/asset1cvqgx3z9u8l54amkyk894tr23gyx63c6wpd7r2.svg",
                    decimals: campaign.base_decimals
                };
            }
        } else {
            selectedAsset = {
                name: campaign.token_name,
                tokenId: campaign.token_policy_id,
                icon: campaign.token_icon_url || "https://raw.githubusercontent.com/spectrum-finance/token-logos/master/logos/ergo/token.svg",
                decimals: campaign.token_decimals
            };
        }
        step = 'amount';
    }

    function goBack() {
        step = 'select';
        amount = '';
    }

    // Update fee calculations
    $: feeAmount = amount ? new BigNumber(amount).dividedBy(100).multipliedBy(MEW_FEE_PERCENTAGE) : new BigNumber(0);
    $: totalAmount = amount ? new BigNumber(amount).plus(feeAmount) : new BigNumber(0);
    $: isValidAmount = amount && 
        new BigNumber(amount).gte(getMinContribution(selectedAsset?.name === campaign.base_name)) && 
        new BigNumber(amount).lte(getMaxContribution(selectedAsset?.name === campaign.base_name)) &&
        new BigNumber(amount).plus(feeAmount).lte(getCurrentBalance(selectedAsset?.name === campaign.base_name));

    function handleSubmit() {
        if (!isValidAmount || loading) return;
        
        dispatch('contribute', {
            amount: amount,
            selectedAsset
        });
    }

    function handleEscape(event) {
        if (event.key === 'Escape' && !loading) {
            onClose();
        }
    }


</script>

<svelte:window on:keydown={handleEscape}/>

<div class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 modal-backdrop"
    on:click|self={onClose}>
    <div class="modal-content rounded-lg p-6 w-full max-w-md mx-4">
        <!-- Header -->
        <div class="flex justify-between items-center mb-6">
            <div>
                <h3 class="text-xl font-bold text-primary">{campaign.title}</h3>
                <p class="text-sm text-gray-400">Campaign ends: {new Date(campaign.end_date).toLocaleDateString()}</p>
            </div>
            <button 
                class="text-gray-400 hover:text-yellow-400 transition-colors"
                on:click={onClose}
                disabled={loading}>
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
        </div>

        <div class="text-gray-300 text-sm mb-6">{campaign.description}</div>
        
        {#if step === 'select'}
            <!-- Asset Selection Step -->
            <div class="space-y-4">
                <h4 class="text-primary font-medium mb-2">Select token to contribute:</h4>
                
                <!-- Base Token Selection -->
                <button
                    class="selection-button w-full p-4 rounded-lg transition-colors flex items-center space-x-3"
                    on:click={() => selectAsset(true)}>
                    <img 
                        src="https://spectrum.fi/logos/ergo/0000000000000000000000000000000000000000000000000000000000000000.svg" 
                        alt={campaign.base_name} 
                        class="w-8 h-8"
                        on:error={(e) => handleImageError(e, true)}
                    />
                    <div class="text-left flex-1">
                        <div class="text-primary font-bold font-medium">{campaign.base_name}</div>
                        <div class="text-gray-400 text-sm">
                            {#if balanceLoading}
                                Loading balance...
                            {:else if balanceError}
                                <span class="text-red-500">{balanceError}</span>
                            {:else}
                                <div class="flex flex-col">
                                    <span>Balance: {nFormatter(getCurrentBalance(true))} {campaign.base_name}</span>
                                    {#if !hasSufficientBalance(true)}
                                        <a 
                                            href={getSwapUrl(true)} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            class="text-cyan-500 hover:text-cyan-400 text-xs mt-1"
                                            on:click|stopPropagation
                                        >
                                            {campaign.base_name === 'ERG' 
                                                ? '→ Get some ERG from MewFinance DEX'
                                                : `→ Swap for ${campaign.base_name} on MewFinance DEX`}
                                        </a>
                                    {/if}
                                </div>
                            {/if}
                            <div class="mt-1">
                                Min: {campaign.min_contribution} | Max: {campaign.max_contribution}
                            </div>
                        </div>
                    </div>
                    <div class="text-gray-400">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                        </svg>
                    </div>
                </button>

               <!-- Project Token Selection -->
{#if campaign.campaign_type === 'multiassetlp' || campaign.campaign_type === 'ergassetlp'}
<button
    class="selection-button w-full p-4 rounded-lg transition-colors flex items-center space-x-3"
    on:click={() => selectAsset(false)}>
    <img
        src="{campaign.token_icon_url}"
        alt={campaign.token_name}
        class="w-8 h-8"
        on:error={(e) => handleImageError(e, false)}
    />
    <div class="text-left flex-1">
        <div class="text-primary font-bold font-medium">{campaign.token_name}</div>
        <div class="text-gray-400 text-sm">
            {#if balanceLoading}
                Loading balance...
            {:else if balanceError}
                <span class="text-red-500">{balanceError}</span>
            {:else}
                <div class="flex flex-col">
                    <span>Balance: {nFormatter(getCurrentBalance(false))} {campaign.token_name}</span>
                    {#if !hasSufficientBalance(false) && !(campaign.campaign_type === 'ergassetlp' && campaign.token_name.toLowerCase().startsWith('rs'))}
                        
                           <a href={getSwapUrl(false)}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="text-cyan-500 hover:text-cyan-400 text-xs mt-1"
                            on:click|stopPropagation
                        >
                            → Swap for {campaign.token_name} on MewFinance DEX
                        </a>
                    {/if}
                </div>
            {/if}
            <div class="mt-1">
                Min: {campaign.min_token} | Max: {campaign.max_token}
            </div>
        </div>
    </div>
    <div class="text-gray-400">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
    </div>
</button>
{/if}

                <!-- Campaign Info Summary -->
                <div class="mt-6 space-y-3 bg-bg rounded-lg p-4">
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-400">Platform Fee:</span>
                        <span class="text-white">{MEW_FEE_PERCENTAGE}%</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-400">Min Contribution:</span>
                        <span class="text-white">{campaign.min_contribution} <span class="font-bold text-primary">{campaign.base_name}</span></span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-400">Max Contribution:</span>
                        <span class="text-white">{campaign.max_contribution} <span class="font-bold text-primary">{campaign.base_name}</span></span>
                    </div>
                    {#if campaign.vesting_schedule}
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-400">Vesting Period:</span>
                            <span class="text-white">{campaign.vesting_schedule}</span>
                        </div>
                    {/if}
                    {#if campaign.liquidity_lock_period}
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-400">LP Lock Period:</span>
                            <span class="text-white">{campaign.liquidity_lock_period}</span>
                        </div>
                    {/if}
                </div>
            </div>
        {:else}
            <!-- Amount Input Step -->
            <div class="space-y-4">
                <!-- Back Button -->
                <button
                    class="text-gray-400 hover:text-white flex items-center space-x-2 transition-colors"
                    on:click={goBack}
                    disabled={loading}>
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                    </svg>
                    <span>Back to token selection</span>
                </button>

                <!-- Selected Asset Info -->
                <div class="input-container bg-bg p-3 rounded-lg">
                    <div class="flex items-center space-x-3 mb-4">
                        <img 
                            src={selectedAsset.icon} 
                            alt={selectedAsset.name} 
                            class="w-8 h-8"
                            on:error={(e) => handleImageError(e, selectedAsset.name === campaign.base_name)}
                        />
                        <div>
                            <h4 class="text-primary font-bold font-medium">{selectedAsset.name}</h4>
                            <div class="text-gray-400 text-sm">
                                {#if balanceLoading}
                                    Loading balance...
                                {:else if balanceError}
                                    <span class="text-red-500">{balanceError}</span>
                                {:else}
                                    <div class="flex flex-col">
                                        <span>Balance: {nFormatter(getCurrentBalance(selectedAsset.name === campaign.base_name))} {selectedAsset.name}</span>
                                        {#if !hasSufficientBalance(selectedAsset.name === campaign.base_name)}
                                            <a 
                                                href={getSwapUrl(selectedAsset.name === campaign.base_name)} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                class="text-cyan-500 hover:text-cyan-400 text-xs mt-1"
                                            >
                                                {selectedAsset.name === 'ERG' 
                                                    ? '→ Get some ERG from MewFinance DEX'
                                                    : `→ Swap for ${selectedAsset.name} on MewFinance DEX`}
                                            </a>
                                        {/if}
                                    </div>
                                {/if}
                            </div>
                        </div>
                    </div>

                    <!-- Amount Input -->
                    <div class="space-y-2">
                        <div class="relative">
                            <input
                                type="number"
                                bind:value={amount}
                                min={getMinContribution(selectedAsset.name === campaign.base_name)}
                                max={getMaxContribution(selectedAsset.name === campaign.base_name)}
                                step="any"
                                class="amount-input w-full px-3 py-2 rounded text-white border focus:outline-none"
                                placeholder={`Enter amount in ${selectedAsset.name}`}
                                disabled={loading}
                            />
                            <button 
                                class="absolute right-2 top-1/2 -translate-y-1/2 pe-2 text-sm text-cyan-500 hover:text-cyan-400"
                                on:click={() => amount = getMaxContribution(selectedAsset.name === campaign.base_name)}
                                disabled={loading}>
                                MAX
                            </button>
                        </div>

                        {#if amount && !isNaN(amount) && Number(amount) > 0}
                            <!-- Contribution Breakdown -->
                            <div class="mt-0 space-y-2 bg-bg pt-4 pb-1 px-1 rounded-lg">
                                <div class="flex justify-between text-sm">
                                    <span class="text-gray-400">Campaign contribution:</span>
                                    <span class="text-white">{nFormatter(amount)} <span class="font-bold text-primary">{selectedAsset.name}</span></span>
                                </div>
                                <div class="flex justify-between text-sm">
                                    <span class="text-gray-400">Platform fee ({MEW_FEE_PERCENTAGE}%):</span>
                                    <span class="text-white">{nFormatter(feeAmount)} <span class="font-bold text-primary">{selectedAsset.name}</span></span>
                                </div>
                                <div class="border-t border-gray-700 my-2"></div>
                                <div class="flex justify-between text-sm font-medium">
                                    <span class="text-gray-400">Total amount to pay:</span>
                                    <span class="text-white">{totalAmount.toString()} <span class="font-bold text-primary">{selectedAsset.name}</span></span>
                                </div>
                            </div>

                            <!-- Validation Messages -->
                            {#if !isValidAmount}
                                <div class="text-red-500 text-sm mt-2 px-1">
                                    {#if new BigNumber(amount).lt(getMinContribution(selectedAsset.name === campaign.base_name))}
                                        Amount must be at least {getMinContribution(selectedAsset.name === campaign.base_name)} {selectedAsset.name}
                                    {:else if new BigNumber(amount).gt(getMaxContribution(selectedAsset.name === campaign.base_name))}
                                        Amount cannot exceed {getMaxContribution(selectedAsset.name === campaign.base_name)} {selectedAsset.name}
                                    {:else if new BigNumber(totalAmount).gt(getCurrentBalance(selectedAsset.name === campaign.base_name))}
                                        <div class="flex flex-col">
                                            <span>Insufficient balance. You need {totalAmount.toString()} {selectedAsset.name}</span>
                                            <a 
                                                href={getSwapUrl(selectedAsset.name === campaign.base_name)} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                class="text-cyan-500 hover:text-cyan-400 text-xs mt-1"
                                            >
                                                {selectedAsset.name === 'ERG' 
                                                    ? '→ Get some ERG from MewFinance DEX'
                                                    : `→ Swap for ${selectedAsset.name} on MewFinance DEX`}
                                            </a>
                                        </div>
                                    {/if}
                                </div>
                            {/if}
                        {/if}
                    </div>
                </div>

                <!-- Submit Button -->

                <button
                    class="submit-button w-full py-3 px-4 btn btn-primary text-black font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    on:click={handleSubmit}
                    disabled={!isValidAmount || loading}
                >
                    {#if loading}
                      <div class="flex items-center justify-center">
                            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          Processing...
                       </div>
                    {:else}
                      Contribute {amount ? `${totalAmount.toString()} ${selectedAsset.name}` : ''}
                 {/if}
              </button>
              <!-- Terms & Conditions -->
              <div class="text-gray-400 text-xs text-center mt-3">
                  By contributing, you agree to the campaign's terms and conditions. 
                                    <br>A {MEW_FEE_PERCENTAGE}% platform fee will be added to your contribution amount.              
                                 </div>          
                                 </div>
  {/if}
 </div>
</div>


<style>
    input:focus {
        border: 1px solid var(--main-color) !important;
    }

    .modal-backdrop {
        backdrop-filter: blur(2px);
    }

    .modal-content {
        background-color: var(--forms-bg);
        border: 2px solid var(--info-color) !important;
    }

    .selection-button {
        background-color: var(--background);
    }

    .selection-button:hover {
        background-color: var(--main-color);
    }

    .selection-button:hover > * {
        color: var(--background) !important;
    }

    .selection-button:hover svg {
        stroke: var(--background) !important;
    }

    .selection-button:hover .text-primary {
        color: var(--background) !important;
    }

    .selection-button:hover .text-gray-400 {
        color: var(--background) !important;
    }

    .input-container {
        background-color: var(--background);
        transition: all 0.2s ease-in-out;
    }

    .amount-input {
        background-color: var(--forms-bg);
        border-color: rgba(255, 255, 255, 0.1);
    }

    .amount-input:focus {
        border-color: var(--main-color);
    }

    .submit-button {
        background-color: var(--main-color);
    }

    .submit-button:hover:not(:disabled) {
        background-color: var(--main-color-hover);
    }

    .submit-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    input[type="number"]::-webkit-inner-spin-button,
    input[type="number"]::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    input[type="number"] {
        -moz-appearance: textfield;
    }

    button:disabled {
        cursor: not-allowed;
    }

    /* Link Styles */
    a.text-cyan-500 {
        text-decoration: none;
        transition: all 0.2s ease-in-out;
    }

    a.text-cyan-500:hover {
        text-decoration: underline;
    }

    /* Custom Scrollbar for Modal */
    .modal-content {
        max-height: 90vh;
        overflow-y: auto;
    }

    .modal-content::-webkit-scrollbar {
        width: 8px;
    }

    .modal-content::-webkit-scrollbar-track {
        background: var(--background);
        border-radius: 4px;
    }

    .modal-content::-webkit-scrollbar-thumb {
        background: var(--main-color);
        border-radius: 4px;
    }

    .modal-content::-webkit-scrollbar-thumb:hover {
        background: var(--main-color-hover);
    }

    /* Animation for loading spinner */
    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    .animate-spin {
        animation: spin 1s linear infinite;
    }

    /* Responsive adjustments */
    @media (max-width: 640px) {
        .modal-content {
            margin: 0.5rem;
            max-height: calc(100vh - 2rem);
        }

        .selection-button {
            padding: 0.75rem;
        }

        .w-8 {
            width: 1.5rem;
        }

        .h-8 {
            height: 1.5rem;
        }
    }

    /* Transition effects */
    .transition-colors {
        transition-property: background-color, border-color, color, fill, stroke;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        transition-duration: 150ms;
    }

    /* Custom focus styles */
    *:focus {
        outline: none;
    }

    *:focus-visible {
        outline: 2px solid var(--main-color);
        outline-offset: 2px;
    }

    /* Button states */
    button {
        user-select: none;
    }

    button:active:not(:disabled) {
        transform: scale(0.98);
    }

    /* Input placeholder color */
    input::placeholder {
        color: rgba(156, 163, 175, 0.6);
    }

    /* Selection color */
    ::selection {
        background: var(--main-color);
        color: var(--background);
    }
</style>