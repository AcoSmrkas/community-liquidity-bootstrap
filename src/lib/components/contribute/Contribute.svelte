<script lang="ts">
    import { sendErgoTx } from "$lib/contract/sendergtx.ts"; // Import the Ergo transaction function
    import ErgopayModal from '$lib/components/common/ErgopayModal.svelte';

    
    let activeTab = 'ergo';
    let ergoAmount = '';
    let ergoToken = 'erg'; // 'erg' or 'rsada'
    let cardanoAmount = '';
    let cardanoToken = 'ada'; // 'ada' or 'rserg'

    // Ergo form submission handler
    const handleErgoSubmit = async () => {
        try {
            console.log('Ergo submission:', { amount: ergoAmount, token: ergoToken });

            // Call the external function to send Ergo transaction
            const txId = await sendErgoTx(ergoToken, ergoAmount);
            console.log('Transaction ID:', txId);
        } catch (error) {
            console.error('Error during transaction:', error);
        }
    };

    const handleCardanoSubmit = () => {
        console.log('Cardano submission:', { amount: cardanoAmount, token: cardanoToken });
    };
</script>

<div class="container top-margin text-white mb-5">
    <div class="container mx-auto px-4 py-8 max-w-2xl">
        <h1 class="text-4xl font-bold text-white text-center mb-8">Contribute</h1>

        <!-- Tab buttons -->
        <div class="flex space-x-4 mb-6">
            <button
                class="flex-1 px-6 py-2 rounded-lg font-medium transition-colors duration-200 {activeTab === 'ergo' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}"
                on:click={() => activeTab = 'ergo'}
            >
                Ergo
            </button>
            <button
                class="flex-1 px-6 py-2 rounded-lg font-medium transition-colors duration-200 {activeTab === 'cardano' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}"
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
                        <label class="block text-gray-300 mb-2">Select Token</label>
                        <select
                            bind:value={ergoToken}
                            class="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-purple-500 focus:outline-none"
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
                            class="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-purple-500 focus:outline-none"
                            placeholder="Enter amount"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        class="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
                    >
                        Submit
                    </button>
                </form>
            {:else}
                <form on:submit|preventDefault={handleCardanoSubmit} class="space-y-4">
                    <div>
                        <label class="block text-gray-300 mb-2">Select Token</label>
                        <select
                            bind:value={cardanoToken}
                            class="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-purple-500 focus:outline-none"
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
                            class="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-purple-500 focus:outline-none"
                            placeholder="Enter amount"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        class="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
                    >
                        Submit
                    </button>
                </form>
            {/if}
        </div>
    </div>
</div>
