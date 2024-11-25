<script>
    import { onMount } from 'svelte';
    import { Globe, MessageCircle, Twitter, MessagesSquare } from 'lucide-svelte';
    import { selected_wallet, connected_wallet_address } from "$lib/store/store.ts";
    import { showCustomToast, isWalletConected } from '$lib/utils/utils.js';
    import { fetchBoxes, getBlockHeight } from '$lib/api-explorer/explorer.ts';
    import axios from "axios";
    import { API_HOST } from '$lib/common/const.js';

    export let showModal = false;
    
    let ergoPrice = 0;
    let campaignData = {
        title: "",
        description: "",
        recipient_address: "",
        end_date: "",
        mint_new_token: true,
        total_supply: 0,
        initial_price: 0,
        target_raise: 0,
        min_contribution: 0,
        max_contribution: 0,
        liquidity_info: "100%",
        liquidity_lock_period: "",
        vesting_schedule: "",
        status_phase: "upcoming",
        whitelist_required: false,
        kyc_required: false,
        base_name: "ERG",
        base_token_id: null,
        base_icon_url: "",
        base_target_amount: 0,
        base_decimals: 9,
        token_name: "",
        token_policy_id: "",
        token_icon_url: "",
        token_target_amount: 0,
        token_decimals: 0,
        website: "",
        whitepaper: "",
        telegram: "",
        twitter: "",
        discord: "",
        token_description: "",
        lp_fee: "1.0",
        campaign_type: "mintpluslp",
    };

    let campaignTypes = [
        { value: 'mintpluslp', label: 'Token Mint + LP' },
        { value: 'crowdfund', label: 'Crowdfund' },
        { value: 'lpcreation', label: 'LP Creation' }
    ];

    let currentStep = 1;
    const totalSteps = 4;

    onMount(async () => {
        try {
            const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=ergo&vs_currencies=usd');
            ergoPrice = response.data.ergo.usd;
        } catch (error) {
            console.error('Failed to fetch ERG price:', error);
        }
    });

    async function handleSubmit() {
        if (!isWalletConected()) {
            showCustomToast('Please connect your wallet first', 3000, 'warning');
            return;
        }

        try {
            const ergAmount = 10 / ergoPrice;
            const paymentTxId = await handlePayment(ergAmount);
            
            if (!paymentTxId) {
                showCustomToast('Payment failed', 3000, 'error');
                return;
            }

            const response = await axios.post(`${API_HOST}/mew/fund/createCampaign`, {
                ...campaignData,
                payment_tx_id: paymentTxId
            });

            if (response.data.success) {
                showCustomToast('Campaign created successfully', 3000, 'success');
                showModal = false;
            }
        } catch (error) {
            showCustomToast('Failed to create campaign', 3000, 'error');
            console.error('Campaign creation error:', error);
        }
    }

    async function handlePayment(ergAmount) {
        // Add your payment handling logic here
        // Similar to your contribution handling
        return null; // Replace with actual transaction ID
    }

    function nextStep() {
        if (currentStep < totalSteps) currentStep++;
    }

    function previousStep() {
        if (currentStep > 1) currentStep--;
    }

    function closeModal() {
        showModal = false;
        currentStep = 1;
    }
</script>

{#if showModal}
<div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
    <div class="bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <!-- Header -->
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-white">Create Campaign</h2>
            <button 
                class="text-gray-400 hover:text-white"
                on:click={closeModal}
            >
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        <!-- Progress Steps -->
        <div class="flex justify-between mb-8">
            {#each Array(totalSteps) as _, i}
            <div class="flex items-center">
                <div class="w-8 h-8 rounded-full flex items-center justify-center
                           {i + 1 === currentStep ? 'bg-cyan-500 text-white' : 
                            i + 1 < currentStep ? 'bg-green-500 text-white' : 
                            'bg-gray-700 text-gray-400'}">
                    {i + 1}
                </div>
                {#if i < totalSteps - 1}
                    <div class="h-1 w-full bg-gray-700 mx-2">
                        <div class="h-full bg-cyan-500 transition-all" 
                             style="width: {i + 1 < currentStep ? '100%' : '0%'}"/>
                    </div>
                {/if}
            </div>
            {/each}
        </div>

        <!-- Form Steps -->
        <div class="mb-6">
            <!-- Step 1: Basic Information -->
            {#if currentStep === 1}
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-400 mb-1">Campaign Type</label>
                        <select 
                            bind:value={campaignData.campaign_type}
                            class="w-full p-2 rounded-lg bg-gray-700 text-white border border-gray-600"
                        >
                            {#each campaignTypes as type}
                                <option value={type.value}>{type.label}</option>
                            {/each}
                        </select>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-400 mb-1">Title</label>
                        <input 
                            type="text" 
                            bind:value={campaignData.title}
                            class="w-full p-2 rounded-lg bg-gray-700 text-white border border-gray-600"
                            placeholder="Campaign Title"
                        />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-400 mb-1">Description</label>
                        <textarea 
                            bind:value={campaignData.description}
                            class="w-full p-2 rounded-lg bg-gray-700 text-white border border-gray-600"
                            rows="4"
                            placeholder="Campaign Description"
                        ></textarea>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-400 mb-1">End Date</label>
                        <input 
                            type="date" 
                            bind:value={campaignData.end_date}
                            class="w-full p-2 rounded-lg bg-gray-700 text-white border border-gray-600"
                        />
                    </div>
                </div>

            <!-- Step 2: Token Configuration -->
            {:else if currentStep === 2}
                <div class="space-y-4">
                    {#if campaignData.campaign_type === 'mintpluslp'}
                        <div>
                            <label class="block text-sm font-medium text-gray-400 mb-1">Token Name</label>
                            <input 
                                type="text" 
                                bind:value={campaignData.token_name}
                                class="w-full p-2 rounded-lg bg-gray-700 text-white border border-gray-600"
                                placeholder="Token Name"
                            />
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-400 mb-1">Total Supply</label>
                            <input 
                                type="number" 
                                bind:value={campaignData.total_supply}
                                class="w-full p-2 rounded-lg bg-gray-700 text-white border border-gray-600"
                                placeholder="Total Supply"
                            />
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-400 mb-1">Token Decimals</label>
                            <input 
                                type="number" 
                                bind:value={campaignData.token_decimals}
                                class="w-full p-2 rounded-lg bg-gray-700 text-white border border-gray-600"
                                placeholder="Token Decimals"
                            />
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-400 mb-1">Token Description</label>
                            <textarea 
                                bind:value={campaignData.token_description}
                                class="w-full p-2 rounded-lg bg-gray-700 text-white border border-gray-600"
                                rows="4"
                                placeholder="Token Description"
                            ></textarea>
                        </div>
                    {:else}
                        <div>
                            <label class="block text-sm font-medium text-gray-400 mb-1">Base Token ID</label>
                            <input 
                                type="text" 
                                bind:value={campaignData.base_token_id}
                                class="w-full p-2 rounded-lg bg-gray-700 text-white border border-gray-600"
                                placeholder="Base Token ID"
                            />
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-400 mb-1">Base Token Name</label>
                            <input 
                                type="text" 
                                bind:value={campaignData.base_name}
                                class="w-full p-2 rounded-lg bg-gray-700 text-white border border-gray-600"
                                placeholder="Base Token Name"
                            />
                        </div>
                    {/if}
                </div>

            <!-- Step 3: Campaign Configuration -->
            {:else if currentStep === 3}
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-400 mb-1">Target Raise</label>
                        <input 
                            type="number" 
                            bind:value={campaignData.target_raise}
                            class="w-full p-2 rounded-lg bg-gray-700 text-white border border-gray-600"
                            placeholder="Target Raise Amount"
                        />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-400 mb-1">Min Contribution</label>
                        <input 
                            type="number" 
                            bind:value={campaignData.min_contribution}
                            class="w-full p-2 rounded-lg bg-gray-700 text-white border border-gray-600"
                            placeholder="Minimum Contribution"
                        />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-400 mb-1">Max Contribution</label>
                        <input 
                            type="number" 
                            bind:value={campaignData.max_contribution}
                            class="w-full p-2 rounded-lg bg-gray-700 text-white border border-gray-600"
                            placeholder="Maximum Contribution"
                        />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-400 mb-1">LP Fee (%)</label>
                        <input 
                            type="number" 
                            bind:value={campaignData.lp_fee}
                            class="w-full p-2 rounded-lg bg-gray-700 text-white border border-gray-600"
                            placeholder="LP Fee Percentage"
                        />
                    </div>

                    <div class="flex items-center gap-4">
                        <div class="flex items-center">
                            <input 
                                type="checkbox" 
                                bind:checked={campaignData.whitelist_required}
                                class="mr-2"
                            />
                            <label class="text-sm font-medium text-gray-400">Whitelist Required</label>
                        </div>
                        <div class="flex items-center">
                            <input 
                                type="checkbox" 
                                bind:checked={campaignData.kyc_required}
                                class="mr-2"
                            />
                            <label class="text-sm font-medium text-gray-400">KYC Required</label>
                        </div>
                    </div>
                </div>

            <!-- Step 4: Social Links -->
            {:else if currentStep === 4}
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-400 mb-1">Website</label>
                        <input 
                            type="url" 
                            bind:value={campaignData.website}
                            class="w-full p-2 rounded-lg bg-gray-700 text-white border border-gray-600"
                            placeholder="Website URL"
                        />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-400 mb-1">Whitepaper</label>
                        <input 
                            type="url" 
                            bind:value={campaignData.whitepaper}
                            class="w-full p-2 rounded-lg bg-gray-700 text-white border border-gray-600"
                            placeholder="Whitepaper URL"
                        />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-400 mb-1">Telegram</label>
                        <input 
                            type="url" 
                            bind:value={campaignData.telegram}
                            class="w-full p-2 rounded-lg bg-gray-700 text-white border border-gray-600"
                            placeholder="Telegram URL"
                        />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-400 mb-1">Twitter</label>
                        <input 
                            type="url" 
                            bind:value={campaignData.twitter}
                            class="w-full p-2 rounded-lg bg-gray-700 text-white border border-gray-600"
                            placeholder="Twitter URL"
                        />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-400 mb-1">Discord</label>
                        <input 
                            type="url" 
                            bind:value={campaignData.discord}
                            class="w-full p-2 rounded-lg bg-gray-700 text-white border border-gray-600"
                            placeholder="Discord URL"
                        />
                    </div>
                </div>
            {/if}
        </div>

        <!-- Navigation Buttons -->
        <div class="flex justify-between mt-8">
            <button
                class="px-4 py-2 rounded-lg font-medium transition-colors bg-transparent border border-gray-600 text-white hover:bg-gray-700"
                on:click={previousStep}
                disabled={currentStep === 1}
            >
                Previous
            </button>

            {#if currentStep === totalSteps}
                <button
                    class="px-4 py-2 rounded-lg font-medium transition-colors bg-cyan-500 text-white hover:bg-cyan-600"
                    on:click={handleSubmit}
                >
                    Create Campaign ({(10 / ergoPrice).toFixed(2)} ERG)
                </button>
            {:else}
                <button
                    class="px-4 py-2 rounded-lg font-medium transition-colors bg-cyan-500 text-white hover:bg-cyan-600"
                    on:click={nextStep}
                >
                    Next
                </button>
            {/if}
        </div>
    </div>
</div>
{/if}

<style>
    /* Additional styling for form elements focus states */
    input:focus, 
    select:focus, 
    textarea:focus {
        border-color: rgb(6 182 212);
        outline: none;
    }

    /* Styling for disabled buttons */
    button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    /* Custom checkbox styling */
    input[type="checkbox"] {
        width: 1rem;
        height: 1rem;
        border-radius: 0.25rem;
        border: 1px solid rgb(75 85 99);
        background-color: rgb(55 65 81);
        cursor: pointer;
    }

    input[type="checkbox"]:checked {
        background-color: rgb(6 182 212);
        border-color: rgb(6 182 212);
    }

    /* Custom date input styling */
    input[type="date"] {
        color-scheme: dark;
    }

    /* Scrollbar styling */
    ::-webkit-scrollbar {
        width: 8px;
    }

    ::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.1);
        border-radius: 4px;
    }

    ::-webkit-scrollbar-thumb {
        background: rgba(6, 182, 212, 0.5);
        border-radius: 4px;
    }

    ::-webkit-scrollbar-thumb:hover {
        background: rgba(6, 182, 212, 0.7);
    }

    /* Remove number input arrows */
    input[type="number"]::-webkit-inner-spin-button,
    input[type="number"]::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    input[type="number"] {
        -moz-appearance: textfield;
    }
</style>