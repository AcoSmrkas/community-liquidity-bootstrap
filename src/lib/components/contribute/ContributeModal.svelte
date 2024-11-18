<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { MEW_FEE_PERCENTAGE } from '$lib/common/const.js';
    import { BigNumber } from 'bignumber.js';

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

    $: feeAmount = amount ? new BigNumber(amount).multipliedBy(MEW_FEE_PERCENTAGE).dividedBy(100) : new BigNumber(0);
    $: campaignAmount = amount ? new BigNumber(amount).minus(feeAmount) : new BigNumber(0);
    $: isValidAmount = amount && 
        new BigNumber(amount).gte(campaign.min_contribution) && 
        new BigNumber(amount).lte(campaign.max_contribution);

    function getCurrentBalance(isBaseToken) {
        return campaignBalances[campaign.id]?.[
            isBaseToken ? 'baseToken' : 'projectToken'
        ]?.current || 0;
    }

    function selectAsset(isBaseToken) {
        selectedAsset = {
            name: isBaseToken ? campaign.base_name : campaign.token_name,
            tokenId: isBaseToken ? (campaign.base_name === 'ERG' ? null : campaign.base_token_id) : campaign.token_policy_id,
            icon: isBaseToken ? campaign.base_icon_url : campaign.token_icon_url,
            decimals: isBaseToken ? campaign.base_decimals : campaign.token_decimals
        };
        step = 'amount';
    }

    function goBack() {
        step = 'select';
        amount = '';
    }

    function handleSubmit() {
        if (!isValidAmount || loading) return;
        
        dispatch('contribute', {
            amount,
            selectedAsset
        });
    }

    function formatNumber(num, decimals = 4) {
        if (!num) return '0';
        const bn = new BigNumber(num);
        return bn.isInteger() ? bn.toFormat(0) : bn.toFormat(decimals);
    }

    function handleEscape(event) {
        if (event.key === 'Escape' && !loading) {
            onClose();
        }
    }
</script>

<svelte:window on:keydown={handleEscape}/>

<div 
    class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 modal-backdrop"
    on:click|self={onClose}
>
    <div class="modal-content rounded-lg p-6 w-full max-w-md mx-4">
        <!-- Header -->
        <div class="flex justify-between items-center mb-6">
            <div>
                <h3 class="text-xl font-bold text-white">{campaign.title}</h3>
                <p class="text-sm text-gray-400">Campaign ends: {new Date(campaign.end_date).toLocaleDateString()}</p>
            </div>
            <button 
                class="text-gray-400 hover:text-white transition-colors"
                on:click={onClose}
                disabled={loading}
            >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
        </div>

        <div class="text-gray-300 text-sm mb-6">{campaign.description}</div>
        
        {#if step === 'select'}
            <!-- Asset Selection Step -->
            <div class="space-y-4">
                <h4 class="text-white font-medium mb-4">Select token to contribute:</h4>
                
                <!-- Base Token Selection -->
                <button
                    class="selection-button w-full p-4 rounded-lg transition-colors flex items-center space-x-3"
                    on:click={() => selectAsset(true)}
                >
                    <img src={campaign.base_icon_url} alt={campaign.base_name} class="w-8 h-8"/>
                    <div class="text-left flex-1">
                        <div class="text-white font-medium">{campaign.base_name}</div>
                        <div class="text-gray-400 text-sm">
                            Min: {campaign.min_contribution} | Max: {campaign.max_contribution}
                        </div>
                    </div>
                    <div class="text-gray-400">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                        </svg>
                    </div>
                </button>

                <!-- Campaign Info Summary -->
                <div class="mt-6 space-y-3 bg-gray-800/30 rounded-lg p-4">
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-400">Platform Fee:</span>
                        <span class="text-white">{MEW_FEE_PERCENTAGE}%</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-400">Min Contribution:</span>
                        <span class="text-white">{campaign.min_contribution} {campaign.base_name}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-400">Max Contribution:</span>
                        <span class="text-white">{campaign.max_contribution} {campaign.base_name}</span>
                    </div>
                    {#if campaign.vesting_schedule}
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-400">Vesting Period:</span>
                            <span class="text-white">{campaign.vesting_schedule}</span>
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
                    disabled={loading}
                >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                    </svg>
                    <span>Back to token selection</span>
                </button>

                <!-- Selected Asset Info -->
                <div class="input-container p-4 rounded-lg">
                    <div class="flex items-center space-x-3 mb-4">
                        <img src={selectedAsset.icon} alt={selectedAsset.name} class="w-8 h-8"/>
                        <div>
                            <h4 class="text-white font-medium">{selectedAsset.name}</h4>
                            <p class="text-gray-400 text-sm">
                                Balance: {formatNumber(getCurrentBalance(selectedAsset.name === campaign.base_name))}
                            </p>
                        </div>
                    </div>

                    <!-- Amount Input -->
                    <div class="space-y-2">
                        <div class="relative">
                            <input
                                type="number"
                                bind:value={amount}
                                min={campaign.min_contribution}
                                max={campaign.max_contribution}
                                step="any"
                                class="amount-input w-full px-3 py-2 rounded text-white border focus:outline-none"
                                placeholder={`Enter amount in ${selectedAsset.name}`}
                                disabled={loading}
                            />
                            <button 
                                class="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-cyan-500 hover:text-cyan-400"
                                on:click={() => amount = campaign.max_contribution}
                                disabled={loading}
                            >
                                MAX
                            </button>
                        </div>

                        {#if amount && !isNaN(amount) && Number(amount) > 0}
                            <!-- Contribution Breakdown -->
                            <div class="mt-4 space-y-2 bg-gray-800/30 p-4 rounded-lg">
                                <div class="flex justify-between text-sm">
                                    <span class="text-gray-400">You pay:</span>
                                    <span class="text-white">{formatNumber(amount)} {selectedAsset.name}</span>
                                </div>
                                <div class="flex justify-between text-sm">
                                    <span class="text-gray-400">Platform fee ({MEW_FEE_PERCENTAGE}%):</span>
                                    <span class="text-white">{formatNumber(feeAmount)} {selectedAsset.name}</span>
                                </div>
                                <div class="border-t border-gray-700 my-2"></div>
                                <div class="flex justify-between text-sm font-medium">
                                    <span class="text-gray-400">To campaign:</span>
                                    <span class="text-white">{formatNumber(campaignAmount)} {selectedAsset.name}</span>
                                </div>
                            </div>

                            <!-- Validation Messages -->
                            {#if !isValidAmount}
                                <div class="text-red-500 text-sm mt-2">
                                    {#if new BigNumber(amount).lt(campaign.min_contribution)}
                                        Amount must be at least {campaign.min_contribution} {selectedAsset.name}
                                    {:else if new BigNumber(amount).gt(campaign.max_contribution)}
                                        Amount cannot exceed {campaign.max_contribution} {selectedAsset.name}
                                    {/if}
                                </div>
                            {/if}
                        {/if}
                    </div>
                </div>

                <!-- Submit Button -->
                <button
                    class="submit-button w-full px-4 py-3 rounded text-white disabled:opacity-50 transition-colors"
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
                        Contribute {amount ? `${formatNumber(amount)} ${selectedAsset.name}` : ''}
                    {/if}
                </button>

                <!-- Terms & Conditions -->
                <div class="text-gray-400 text-xs text-center mt-4">
                    By contributing, you agree to the campaign's terms and conditions. 
                    <br>A {MEW_FEE_PERCENTAGE}% platform fee will be deducted from your contribution.
                </div>
            </div>
        {/if}
    </div>
</div>

<style>
    .modal-backdrop {
        backdrop-filter: blur(2px);
    }

    .modal-content {
        background-color: var(--forms-bg);
    }

    .selection-button {
        background-color: var(--forms-bg);
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .selection-button:hover {
        background-color: var(--main-color);
        opacity: 0.9;
    }

    .input-container {
        background-color: var(--forms-bg);
        border: 1px solid rgba(255, 255, 255, 0.1);
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
        opacity: 0.9;
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
</style>