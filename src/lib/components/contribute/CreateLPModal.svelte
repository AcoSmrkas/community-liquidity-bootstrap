<script lang="ts">
    import { buildMintLPTokenTx, buildCreateLPTx } from '$lib/contract/lpTxBuilder.ts';
    import { selected_wallet, connected_wallet_address } from "$lib/store/store.ts";
    import { fetchBoxes, getBlockHeight } from '$lib/api-explorer/explorer.ts';
    import { showCustomToast, isWalletConected } from '$lib/utils/utils.js';
    import { isWalletErgo } from '$lib/common/wallet.ts';
    import { get } from "svelte/store";
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    export let campaign;
    export let onClose;
    export let ergopayState = {
        showErgopayModal: false,
        isAuth: false,
        unsignedTx: null
    };

    let loading = false;
    let step = 1; // 1: Confirm, 2: Minting LP Token, 3: Creating Pool, 4: Waiting
    let lpTokenId = '';
    let error = null;
    let waitingForConfirmation = false;

    const DEBUG = true;

    function debugLog(...args) {
        if (DEBUG) {
            console.log('[CreateLPModal]', ...args);
        }
    }

    async function handleMintTransaction(params, selectedWallet) {
        debugLog('Building mint transaction');
        const mintTx = await buildMintLPTokenTx(
            params.utxos,
            params.height,
            {
                userAddress: params.myAddress,
                ergAmount: campaign.assets.base.targetAmount.toString(),
                tokenAmount: campaign.assets.token.targetAmount.toString(),
                tokenId: campaign.assets.token.tokenId,
                tokenDecimals: campaign.assets.token.decimals,
                proxyAddress: campaign.recipientAddress,
                campaignId: campaign.id
            }
        );

        if (selectedWallet === 'ergopay') {
            ergopayState.unsignedTx = mintTx;
            ergopayState.isAuth = false;
            ergopayState.showErgopayModal = true;
            onClose();
            return null;
        }

        debugLog('Signing mint transaction');
        const signedMintTx = await ergo.sign_tx(mintTx);
        debugLog('Submitting mint transaction');
        return await ergo.submit_tx(signedMintTx);
    }

    async function handlePoolTransaction(params, lpTokenId) {
        debugLog('Building pool transaction');
        const poolTx = await buildCreateLPTx(
            params.utxos,
            params.height,
            {
                userAddress: params.myAddress,
                ergAmount: campaign.assets.base.targetAmount.toString(),
                tokenAmount: campaign.assets.token.targetAmount.toString(),
                tokenId: campaign.assets.token.tokenId,
                tokenDecimals: campaign.assets.token.decimals,
                proxyAddress: campaign.recipientAddress,
                campaignId: campaign.id
            },
            lpTokenId
        );

        debugLog('Signing pool transaction');
        const signedPoolTx = await ergo.sign_tx(poolTx);
        debugLog('Submitting pool transaction');
        return await ergo.submit_tx(signedPoolTx);
    }

    async function waitForConfirmation(txId) {
    debugLog('Waiting for confirmation of tx:', txId);
    waitingForConfirmation = true;
    let attempts = 0;
    const maxAttempts = 15; // Increased attempts
    
    while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 4000)); // Increased wait time
        try {
            const utxos = await fetchBoxes($connected_wallet_address);
            debugLog('Checking UTXOs for LP token:', utxos.length);
            
            // Check for minted token box
            const foundBox = utxos.find(box => 
                box.assets?.some(token => 
                    token.tokenId === txId || // Check by token ID
                    box.boxId === txId     // Check by box ID
                )
            );

            if (foundBox) {
                debugLog('Found LP token box:', foundBox);
                return true;
            }
        } catch (e) {
            debugLog('Error checking confirmation:', e);
        }
        attempts++;
        debugLog('Confirmation attempt:', attempts);
    }
    throw new Error('Transaction confirmation timeout');
}

    async function createLP() {
        error = null;
        const selectedWallet = get(selected_wallet);

        if (!isWalletConected()) {
            showCustomToast('Please connect your wallet first', 1500, 'info');
            return;
        }

        if (!isWalletErgo(selectedWallet)) {
            showCustomToast('Please connect an Ergo wallet', 1500, 'info');
            return;
        }

        try {
            loading = true;
            debugLog('Starting LP creation process');

            // Get wallet info
            const myAddress = selectedWallet === 'ergopay' 
                ? get(connected_wallet_address)
                : await ergo.get_change_address();
            const height = selectedWallet === 'ergopay'
                ? await getBlockHeight()
                : await ergo.get_current_height();
            const utxos = await fetchBoxes(myAddress);

            debugLog('Wallet info gathered:', { myAddress, height, utxoCount: utxos.length });

            // Step 1: Mint LP Token
            step = 2;
            const mintTxId = await handleMintTransaction(
                { myAddress, height, utxos },
                selectedWallet
            );

            if (!mintTxId) {
                // ErgoPay flow
                return;
            }

            debugLog('LP token minted:', mintTxId);
            showCustomToast('LP token created, waiting for confirmation...', 3000, 'info');
            
            // Wait for mint transaction confirmation
            step = 4;
            await waitForConfirmation(mintTxId);
            lpTokenId = mintTxId;

            // Step 2: Create Pool
            step = 3;
            // Get fresh UTXOs after mint
            const updatedUtxos = await fetchBoxes(myAddress);
            const poolTxId = await handlePoolTransaction(
                { myAddress, height, utxos: updatedUtxos },
                lpTokenId
            );

            if (poolTxId) {
                debugLog('Pool created successfully:', poolTxId);
                showCustomToast('LP pool created successfully!', 3000, 'success');
                setTimeout(onClose, 2000);
            }

        } catch (e) {
            debugLog('Error during LP creation:', e);
            error = e.message || 'Failed to create LP pool';
            step = 1;
            showCustomToast(error, 3000, 'error');
        } finally {
            loading = false;
            waitingForConfirmation = false;
        }
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape' && !loading) {
            onClose();
        }
    }
</script>

<svelte:window on:keydown={handleKeydown}/>

<div 
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-backdrop"
    on:click|self={() => !loading && onClose()}
>
    <div class="modal-content rounded-lg p-6 w-full max-w-md mx-4">
        <div class="flex justify-between items-center mb-6">
            <h3 class="text-xl font-bold text-white">Create Liquidity Pool</h3>
            {#if !loading}
                <button 
                    class="text-gray-400 hover:text-white transition-colors"
                    on:click={onClose}
                >
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            {/if}
        </div>

        {#if error}
            <div class="bg-red-500 bg-opacity-20 border border-red-500 rounded-lg p-4 mb-4">
                <p class="text-red-500">{error}</p>
            </div>
        {/if}

        {#if step === 1}
            <div class="space-y-4">
                <p class="text-gray-300">
                    You are about to create a liquidity pool with:
                </p>
                
                <div class="bg-gray-700 rounded-lg p-4 space-y-3">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-2">
                            <img src={campaign.assets.base.icon} alt={campaign.assets.base.name} class="w-6 h-6"/>
                            <span class="text-white">{campaign.assets.base.name}</span>
                        </div>
                        <span class="text-white">{campaign.assets.base.targetAmount}</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-2">
                            <img src={campaign.assets.token.icon} alt={campaign.assets.token.name} class="w-6 h-6"/>
                            <span class="text-white">{campaign.assets.token.name}</span>
                        </div>
                        <span class="text-white">{campaign.assets.token.targetAmount}</span>
                    </div>
                </div>

                <div class="text-sm text-gray-400">
                    <p class="font-medium mb-2">This process will:</p>
                    <ol class="list-decimal ml-4 space-y-1">
                        <li>Create and mint LP tokens</li>
                        <li>Initialize the AMM pool</li>
                        <li>Set initial exchange rates</li>
                    </ol>
                </div>

                <button
                    class="w-full px-4 py-3 bg-main-color hover:opacity-90 rounded-lg text-white disabled:opacity-50 transition-colors mt-4"
                    on:click={createLP}
                    disabled={loading}
                >
                    {loading ? 'Processing...' : 'Create LP Pool'}
                </button>
            </div>
        {:else}
            <div class="space-y-6 text-center py-4">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-main-color mx-auto"></div>
                <div>
                    <p class="text-white font-medium text-lg mb-2">
                        {#if step === 2}
                            Creating LP Token
                        {:else if step === 3}
                            Initializing Pool
                        {:else}
                            Waiting for Confirmation
                        {/if}
                    </p>
                    <p class="text-gray-400 text-sm">
                        {#if step === 2}
                            Minting LP tokens...
                        {:else if step === 3}
                            Setting up the AMM pool...
                        {:else}
                            Waiting for transaction confirmation...
                        {/if}
                    </p>
                </div>
                
                {#if step !== 4}
                    <div class="text-sm text-gray-400">
                        Please confirm the transaction in your wallet
                    </div>
                {/if}
            </div>
        {/if}

        {#if !loading && step === 1}
            <button
                class="mt-4 text-gray-400 text-sm hover:text-white transition-colors w-full text-center"
                on:click={onClose}
            >
                Cancel
            </button>
        {/if}
    </div>
</div>

<style>
    .modal-content {
        background-color: var(--forms-bg);
    }

    .modal-backdrop {
        backdrop-filter: blur(2px);
    }

    .bg-main-color {
        background-color: var(--main-color);
    }

    :global(.modal-content button) {
        font-family: inherit;
    }
</style>