<script lang="ts">
    import { get } from "svelte/store";
    import { selected_wallet, connected_wallet_address } from "$lib/store/store.ts";
    import { fetchBoxes, getBlockHeight } from '$lib/api-explorer/explorer.ts';
    import { showCustomToast, isWalletConected } from '$lib/utils/utils.js';
    import { isWalletErgo } from '$lib/common/wallet.ts';
    import { buildMintLPTokenTx, buildCreatePoolTx } from '$lib/contract/lpTxBuilder.ts';

    export let campaign;
    export let onClose;
    export let ergopayState = {
        showErgopayModal: false,
        isAuth: false,
        unsignedTx: null
    };

    let loading = false;
    let step = 1; // 1: Confirm, 2: Processing Mint, 3: Processing Pool
    let error = null;

    const DEBUG = true;

    function debugLog(...args) {
        if (DEBUG) {
            console.log('[CreateLPModal]', ...args);
        }
    }

    async function handleCreateLP() {
        const selectedWallet = get(selected_wallet);
        debugLog('Starting LP creation process');
        
        try {
            // Get wallet info
            const myAddress = selectedWallet === 'ergopay' 
                ? get(connected_wallet_address)
                : await ergo.get_change_address();
            const height = selectedWallet === 'ergopay'
                ? await getBlockHeight()
                : await ergo.get_current_height();
            const utxos = await fetchBoxes(myAddress);

            debugLog('Wallet info:', { myAddress, height, utxoCount: utxos.length });

            // Step 1: Mint LP Token
            step = 2;
            debugLog('Building mint transaction');
            const mintTx = buildMintLPTokenTx(
                utxos,
                height,
                {
                    userAddress: myAddress,
                    tokenId: campaign.assets.token.tokenId,
                }
            );

            if (selectedWallet === 'ergopay') {
                ergopayState.unsignedTx = mintTx;
                ergopayState.isAuth = false;
                ergopayState.showErgopayModal = true;
                onClose();
                return;
            }

            // Sign and submit mint transaction
            debugLog('Signing mint transaction');
            const signedMintTx = await ergo.sign_tx(mintTx);
            debugLog('Signed mint transaction');
            
            debugLog('Submitting mint transaction');
            const mintTxId = await ergo.submit_tx(signedMintTx);
            debugLog('Mint transaction submitted:', mintTxId);

            showCustomToast('LP token minted, creating pool...', 3000, 'info');

            // Wait a moment and get fresh UTXOs
            await new Promise(resolve => setTimeout(resolve, 2000));
            const updatedUtxos = await fetchBoxes(myAddress);

            // Step 2: Create Pool
            step = 3;
            debugLog('Building pool transaction');
            const poolTx = buildCreatePoolTx(
                updatedUtxos,
                height,
                {
                    userAddress: myAddress,
                    ergAmount: campaign.assets.base.targetAmount.toString(),
                    tokenAmount: campaign.assets.token.targetAmount.toString(),
                    tokenId: campaign.assets.token.tokenId,
                    tokenDecimals: campaign.assets.token.decimals,
                    lpTokenId: mintTxId
                }
            );

            // Sign and submit pool transaction
            debugLog('Signing pool transaction');
            const signedPoolTx = await ergo.sign_tx(poolTx);
            debugLog('Signed pool transaction');
            
            debugLog('Submitting pool transaction');
            const poolTxId = await ergo.submit_tx(signedPoolTx);
            debugLog('Pool transaction submitted:', poolTxId);

            showCustomToast('LP pool created successfully!', 3000, 'success');
            setTimeout(onClose, 2000);

        } catch (e) {
            debugLog('Error creating LP:', e);
            error = e?.info || e?.message || 'Failed to create LP pool';
            step = 1;
            showCustomToast(error, 3000, 'error');
        }
    }

    async function createLP() {
        error = null;

        if (!isWalletConected()) {
            showCustomToast('Please connect your wallet first', 1500, 'info');
            return;
        }

        if (!isWalletErgo(get(selected_wallet))) {
            showCustomToast('Please connect an Ergo wallet', 1500, 'info');
            return;
        }

        try {
            loading = true;
            await handleCreateLP();
        } catch (e) {
            debugLog('Error in createLP:', e);
            error = e?.info || e?.message || 'Failed to create LP pool';
            showCustomToast(error, 3000, 'error');
        } finally {
            loading = false;
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
                        <li>Create LP tokens in your wallet</li>
                        <li>Create liquidity pool with your tokens</li>
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
        {:else if step === 2}
            <div class="space-y-6 text-center py-4">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-main-color mx-auto"></div>
                <div>
                    <p class="text-white font-medium text-lg mb-2">
                        Creating LP Token
                    </p>
                    <p class="text-gray-400 text-sm">
                        Please confirm the first transaction in your wallet
                    </p>
                </div>
            </div>
        {:else if step === 3}
            <div class="space-y-6 text-center py-4">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-main-color mx-auto"></div>
                <div>
                    <p class="text-white font-medium text-lg mb-2">
                        Creating Pool
                    </p>
                    <p class="text-gray-400 text-sm">
                        Please confirm the second transaction in your wallet
                    </p>
                </div>
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