<script lang="ts">
    import { sendErgoTx } from "$lib/contract/sendErgoTx.ts";
    import { sendCardanoTx } from "$lib/contract/sendCardanoTx.ts";
    import { selected_wallet, connected_wallet_address } from "$lib/store/store.ts";
    import { fetchBoxes, getBlockHeight, updateTempBoxes } from '$lib/api-explorer/explorer.ts';
    import { get } from "svelte/store";
    import { showCustomToast, isWalletConected, getCommonBoxIds } from '$lib/utils/utils.js';
    import { isWalletErgo, isWalletCardano } from '$lib/common/wallet.ts';
    import { API_HOST } from '$lib/common/const.js';
    import axios from "axios";

    export let campaign;
    export let onClose;
    export let showErgopayModal;
    export let isAuth;
    export let unsignedTx;

    let selectedAsset = null;
    let amount = '';
    let loading = false;
    let step = 'select';

    const networkType = campaign.id <= 2 ? 'ergo' : 'cardano';

    function selectAsset(asset) {
        selectedAsset = asset;
        step = 'amount';
    }

    function goBack() {
        step = 'select';
        amount = '';
    }

    async function handleSubmit() {
        if (loading || !amount || !selectedAsset) return;
        
        loading = true;
        try {
            if (networkType === 'ergo') {
                await handleErgoSubmit();
            } else {
                await handleCardanoSubmit();
            }
        } finally {
            loading = false;
        }
    }

    async function handleErgoSubmit() {
        const selectedWalletErgo = get(selected_wallet);

        if (!isWalletErgo(selectedWalletErgo) || !isWalletConected()) {
            showCustomToast('Connect an Ergo wallet.', 1500, 'info');
            return;
        }

        try {
            let myAddress, height, utxos;

            if (selectedWalletErgo === 'ergopay') {
                myAddress = get(connected_wallet_address);
                utxos = await fetchBoxes(myAddress);
                height = await getBlockHeight();
            } else {
                myAddress = await ergo.get_change_address();
                utxos = await fetchBoxes($connected_wallet_address);
                height = await ergo.get_current_height();
            }

            const unsigned = await sendErgoTx(
                myAddress,
                utxos,
                selectedAsset.name,
                amount,
                height,
                campaign.id,
                selectedAsset.tokenId,
                campaign.recipientAddress,
                selectedAsset.decimals
            );

            if (selectedWalletErgo === 'ergopay') {
                unsignedTx = unsigned;
                isAuth = false;
                showErgopayModal = true;
                onClose(); // Close the contribute modal
            } else {
                const signed = await ergo.sign_tx(unsigned);
                const transactionId = await ergo.submit_tx(signed);

                if (transactionId) {
                    showCustomToast(`Transaction submitted successfully.<br>TX ID: <a target="_new" href="https://ergexplorer.com/transactions/${transactionId}">${transactionId}</a>`, 5000, 'success');
                    
                    const usedBoxIds = getCommonBoxIds(utxos, signed.inputs);
                    const newOutputs = signed.outputs.filter(output => output.ergoTree == utxos[0].ergoTree);
                    updateTempBoxes(myAddress, usedBoxIds, newOutputs);

                    await logContribution('ergo', selectedAsset.name, amount, transactionId);
                    resetForm();
                    onClose();
                }
            }
        } catch (e) {
            handleTransactionError(e);
        }
    }

    function handleTransactionError(e) {
        console.error(e);
        if (e.message?.includes('Insufficient')) {
            showCustomToast(`Insufficient funds.`, 5000, 'danger');
        } else if (e.info === 'User rejected' || (e.cause?.failure?.cause?.code === 2)) {
            // Handle user rejection
        } else {
            showCustomToast(`Failed to submit TX.`, 5000, 'danger');
        }
    }

    async function logContribution(network, asset, amount, txid) {
        try {
            await axios.post(`${API_HOST}/clb/logContribution`, {
                network,
                asset,
                amount,
                address: $connected_wallet_address,
                txid,
                campaignId: campaign.id
            });
        } catch (e) {
            console.error(e);
        }
    }

    function resetForm() {
        selectedAsset = null;
        amount = '';
        step = 'select';
    }

    function handleClickOutside(event) {
        if (event.target.classList.contains('modal-backdrop')) {
            onClose();
        }
    }

    function handleEscape(event) {
        if (event.key === 'Escape') {
            onClose();
        }
    }
</script>

<svelte:window on:keydown={handleEscape}/>


<div 
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-backdrop"
    on:click={handleClickOutside}
>
    <div class="modal-content rounded-lg p-6 w-full max-w-md mx-4">
        <div class="flex justify-between items-center mb-6">
            <h3 class="text-xl font-bold text-white">{campaign.title}</h3>
            <button 
                class="text-gray-400 hover:text-white transition-colors"
                on:click={onClose}
            >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
        </div>

        <p class="text-gray-300 text-sm mb-6">{campaign.description}</p>
        
        {#if step === 'select'}
            <!-- Asset Selection Step -->
            <div class="space-y-4">
                <h4 class="text-white font-medium mb-4">Select token to contribute:</h4>
                
                <!-- Base Asset Button -->
                <button
                    class="selection-button w-full p-4 rounded-lg transition-colors flex items-center space-x-3"
                    on:click={() => selectAsset(campaign.assets.base)}
                >
                    <img src={campaign.assets.base.icon} alt={campaign.assets.base.name} class="w-8 h-8"/>
                    <div class="text-left">
                        <div class="text-white font-medium">{campaign.assets.base.name}</div>
                        <div class="text-gray-400 text-sm">Target: {campaign.assets.base.targetAmount}</div>
                    </div>
                </button>

                <!-- Token Asset Button -->
                <button
                    class="selection-button w-full p-4 rounded-lg transition-colors flex items-center space-x-3"
                    on:click={() => selectAsset(campaign.assets.token)}
                >
                    <img src={campaign.assets.token.icon} alt={campaign.assets.token.name} class="w-8 h-8"/>
                    <div class="text-left">
                        <div class="text-white font-medium">{campaign.assets.token.name}</div>
                        <div class="text-gray-400 text-sm">Target: {campaign.assets.token.targetAmount}</div>
                    </div>
                </button>
            </div>
        {:else}
            <!-- Amount Input Step -->
            <div class="space-y-4">
                <button
                    class="text-gray-400 hover:text-white flex items-center space-x-2 transition-colors"
                    on:click={goBack}
                >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                    </svg>
                    <span>Back to token selection</span>
                </button>

                <div class="input-container p-4 rounded-lg">
                    <div class="flex items-center space-x-2 mb-4">
                        <img src={selectedAsset.icon} alt={selectedAsset.name} class="w-8 h-8"/>
                        <div>
                            <h4 class="text-white font-medium">{selectedAsset.name}</h4>
                            <p class="text-gray-400 text-sm">Target: {selectedAsset.targetAmount}</p>
                        </div>
                    </div>
                    <div class="space-y-2">
                        <input
                            type="number"
                            bind:value={amount}
                            min="0"
                            step="any"
                            class="amount-input w-full px-3 py-2 rounded text-white border focus:outline-none"
                            placeholder={`Enter amount in ${selectedAsset.name}`}
                        />
                        <p class="text-sm text-gray-400">
                            {#if amount}
                                You will send {amount} {selectedAsset.name}
                            {/if}
                        </p>
                    </div>
                </div>

                <button
                    class="submit-button w-full px-4 py-2 rounded text-white disabled:opacity-50 transition-colors"
                    on:click={handleSubmit}
                    disabled={!amount || loading}
                >
                    {loading ? 'Sending...' : 'Contribute'}
                </button>
            </div>
        {/if}

        <div class="mt-6 text-gray-400 text-sm">
            Campaign ends: {new Date(campaign.endDate).toLocaleDateString()}
        </div>
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
</style>