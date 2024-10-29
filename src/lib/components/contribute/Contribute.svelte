<script lang="ts">
    import { sendErgoTx } from "$lib/contract/sendErgoTx.ts";
    import ErgopayModal from '$lib/components/common/ErgopayModal.svelte';
    import { selected_wallet, connected_wallet_address
     } from "$lib/store/store.ts";
    import { fetchBoxes, getBlockHeight, updateTempBoxes } from '$lib/api-explorer/explorer.ts';  
    import { get } from "svelte/store";
    import { showCustomToast, isWalletConected, getCommonBoxIds } from '$lib/utils/utils.js';
    import { isWalletErgo, isWalletCardano} from '$lib/common/wallet.ts';

    let showErgopayModal = false;
    let isAuth = false;
    let unsignedTx = null;

    let activeTab = 'ergo';
    let ergoAmount = '';
    let ergoToken = 'erg'; // 'erg' or 'rsada'
    let cardanoAmount = '';
    let cardanoToken = 'ada'; // 'ada' or 'rserg'

    // Ergo form submission handler
    const handleErgoSubmit = async () => {
        const selectedWalletErgo = get(selected_wallet);

        if (!isWalletErgo(selectedWalletErgo) || !isWalletConected()) {
            showCustomToast('Connect a wallet.', 1500, 'info');
            return;
        }

        console.log("Selected Wallet Ergo:", selectedWalletErgo);

        if (
            (activeTab == 'ergo' && !ergoAmount)
            ||
            (activeTab == 'cardano' && !cardanoAmount)
        ) {
            showCustomToast('Please input contribution amount.', 1500, 'info');
            return;
        }

        let myAddress, height, utxos;
        unsignedTx = null;

        if ($selected_wallet != 'ergopay') {
            myAddress = await ergo.get_change_address();
            utxos = await fetchBoxes($connected_wallet_address);
            height = await ergo.get_current_height();
        } else {
            myAddress = get(connected_wallet_address);
            utxos = await fetchBoxes($connected_wallet_address);
            height = await getBlockHeight();                  
        }

        try {
            let unsigned = null;

            unsigned = await sendErgoTx(
                myAddress,
                utxos,
                ergoToken,
                ergoAmount,
                height
            );

            if (selectedWalletErgo != 'ergopay') {
                const signed = await ergo.sign_tx(unsigned);
                const transactionId = await ergo.submit_tx(signed);

                console.log("Transaction ID:", transactionId);

                showCustomToast(`Transaction submitted successfully.<br>TX ID: <a target="_new" href="https://ergexplorer.com/transactions/${transactionId}">${transactionId}</a>`, 5000, 'success');

                const usedBoxIds = getCommonBoxIds(utxos, signed.inputs);
                const newOutputs = signed.outputs.filter(output => output.ergoTree == utxos[0].ergoTree);

                updateTempBoxes(myAddress, usedBoxIds, newOutputs);
            } else {
                unsignedTx = unsigned;
                isAuth = false;
                showErgopayModal = true;
            }
        } catch (e) {
            console.error(e);

            if (e.message && e.message.substr(0, 19) == 'Insufficient inputs') {
                showCustomToast(`Insufficient funds.`, 5000, 'danger');
            } else if (e.info && e.info == 'User rejected') {
                // Handle user rejection
            } else {
                showCustomToast(`Failed to submit TX.`, 5000, 'danger');
            }
        }
    };

    const handleCardanoSubmit = () => {
        const selectedWalletErgo = get(selected_wallet);

        if (!isWalletCardano(selectedWalletErgo) || !isWalletConected()) {
            showCustomToast('Connect a wallet.', 1500, 'info');
            return;
        }

        console.log("Selected Wallet Ergo:", selectedWalletErgo);

        console.log('Cardano submission:', { amount: cardanoAmount, token: cardanoToken });
    };
</script>

<div class="container top-margin text-white mb-5">
    <div class="container mx-auto px-0 py-8 max-w-2xl">
        <h1 class="text-4xl font-bold text-white text-center mb-8">Contribute</h1>

        <!-- Tab buttons -->
        <div class="flex space-x-4 mb-6">
            <button
                class="flex-1 px-6 py-2 rounded-lg font-medium transition-colors duration-200 {activeTab === 'ergo' ? 'bg-footer text-primary' : 'bg-form contribute-tab text-gray-300'}"
                on:click={() => activeTab = 'ergo'}
            >
                Ergo
            </button>
            <button
                class="flex-1 px-6 py-2 rounded-lg font-medium transition-colors duration-200 {activeTab === 'cardano' ? 'bg-footer text-primary' : 'bg-form contribute-tab text-gray-300'}"
                on:click={() => activeTab = 'cardano'}
            >
                Cardano
            </button>
        </div>

        <!-- Tab Content -->
        <div class="rounded-lg p-6" style="background-color: var(--forms-bg);">
            {#if activeTab === 'ergo'}
                <form on:submit|preventDefault={handleErgoSubmit} class="space-y-4">
                    <div>
                        <label class="block text-gray-300 mb-2">Asset</label>
                        <select
                            bind:value={ergoToken}
                            class="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none"
                        >
                            <option value="erg">ERG</option>
                            <option value="rsada">rsADA</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-gray-300 mb-2">Amount</label>
                        <input
                            type="number"
                            bind:value={ergoAmount}
                            min="0"
                            step="0.001"
                            class="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none mb-2"
                            placeholder="Enter amount"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        class="w-full mt-4 btn btn-primary"
                    >
                        Submit
                    </button>
                </form>
            {:else}
                <form on:submit|preventDefault={handleCardanoSubmit} class="space-y-4">
                    <div>
                        <label class="block text-gray-300 mb-2">Asset</label>
                        <select
                            bind:value={cardanoToken}
                            class="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none"
                        >
                            <option value="ada">ADA</option>
                            <option value="rserg">rsERG</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-gray-300 mb-2">Amount</label>
                        <input
                            type="number"
                            bind:value={cardanoAmount}
                            min="0"
                            step="0.001"
                            class="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none mb-2"
                            placeholder="Enter amount"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        class="w-full mt-4 btn btn-primary"
                    >
                        Submit
                    </button>
                </form>
            {/if}
        </div>
    </div>
</div>

{#if showErgopayModal}
 <ErgopayModal bind:showErgopayModal bind:isAuth bind:unsignedTx>
   <button slot="btn">Close</button>
 </ErgopayModal>
{/if}

<style>
    .contribute-tab:hover {
        background: var(--main-color);
        color: var(--background);
    }
</style>