<script lang="ts">
    import { sendErgoTx } from "$lib/contract/sendErgoTx.ts";
    import { sendCardanoTx } from "$lib/contract/sendCardanoTx.ts";
    import ErgopayModal from '$lib/components/common/ErgopayModal.svelte';
    import { selected_wallet, connected_wallet_address } from "$lib/store/store.ts";
    import { fetchBoxes, getBlockHeight, updateTempBoxes } from '$lib/api-explorer/explorer.ts';  
    import { get } from "svelte/store";
    import { showCustomToast, isWalletConected, getCommonBoxIds } from '$lib/utils/utils.js';
    import { isWalletErgo, isWalletCardano} from '$lib/common/wallet.ts';
    import { API_HOST } from '$lib/common/const.js';
	import axios from "axios";

    let showErgopayModal = false;
    let isAuth = false;
    let unsignedTx = null;

    let activeTab = 'ergo';
    let ergoAmount = '';
    let ergoToken = 'ERG'; // 'ERG' or 'rsADA'
    let cardanoAmount = '';
    let cardanoToken = 'ADA'; // 'ADA' or 'rsERG'

    // Ergo form submission handler
    const handleErgoSubmit = async () => {
        const selectedWalletErgo = get(selected_wallet);

        if (!isWalletErgo(selectedWalletErgo) || !isWalletConected()) {
            showCustomToast('Connect a Ergo wallet.', 1500, 'info');
            return;
        }

        console.log("Selected Wallet Ergo:", selectedWalletErgo);

        if (!ergoAmount) {
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

                if (transactionId) {
                    showCustomToast(`Transaction submitted successfully.<br>TX ID: <a target="_new" href="https://ergexplorer.com/transactions/${transactionId}">${transactionId}</a>`, 5000, 'success');

                    const usedBoxIds = getCommonBoxIds(utxos, signed.inputs);
                    const newOutputs = signed.outputs.filter(output => output.ergoTree == utxos[0].ergoTree);

                    updateTempBoxes(myAddress, usedBoxIds, newOutputs);

                    logContribution('ergo', ergoToken, ergoAmount, transactionId);
                }
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

    let onTxSubmitted = function (txId) {
        logContribution('ergo', ergoToken, ergoAmount, txId);
    }

    const handleCardanoSubmit = async () => {
        const selectedWalletErgo = get(selected_wallet);

        if (!isWalletCardano(selectedWalletErgo) || !isWalletConected()) {
            showCustomToast('Connect a Cardano wallet.', 1500, 'info');
            return;
        }

        console.log("Selected Wallet Cardano:", selectedWalletErgo);

        if (!cardanoAmount) {
            showCustomToast('Please input contribution amount.', 1500, 'info');
            return;
        }

        try {
            const unsigned = await sendCardanoTx($selected_wallet, cardanoToken, cardanoAmount);
            const signed = await unsigned.sign.withWallet().complete();
            const transactionId = await signed.submit();

            if (transactionId) {
                showCustomToast(`Transaction submitted successfully.<br>TX ID: <a target="_new" href="https://cexplorer.io/tx/${transactionId}">${transactionId}</a>`, 5000, 'success');

                logContribution('cardano', cardanoToken, cardanoAmount, transactionId);
            }
        } catch (e) {
            console.error(e);

            let userDecline = false;
            try {
                userDecline = JSON.parse(JSON.stringify(e)).cause.failure.cause.code == 2;
            } catch (ex) { }

            if (!userDecline) {
                if (e.message && e.message.substr(0, 50) == '{ Complete: Your wallet does not have enough funds') {
                    showCustomToast(`Insufficient funds.`, 5000, 'danger');
                } else {
                    showCustomToast(`Failed to submit TX.`, 5000, 'danger');
                }
            }
        }
    };

    async function logContribution(network, asset, amount, txid) {
        try {
            await axios.post(`${API_HOST}/clb/logContribution`, 
                {
                    network: network,
                    asset: asset,
                    amount: amount,
                    address: $connected_wallet_address,
                    txid: txid
                }
            );
        } catch (e) {
            console.error(e);
        }
    }

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
                            <option value="ERG">ERG</option>
                            <option value="rsADA">rsADA</option>
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
                            <option value="ADA">ADA</option>
                            <option value="rsERG">rsERG</option>
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
 <ErgopayModal bind:onTxSubmitted bind:showErgopayModal bind:isAuth bind:unsignedTx>
   <button slot="btn">Close</button>
 </ErgopayModal>
{/if}

<style>
    .contribute-tab:hover {
        background: var(--main-color);
        color: var(--background);
    }
</style>