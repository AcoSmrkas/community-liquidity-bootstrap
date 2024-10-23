<script lang="ts">
    import { OutputBuilder, TransactionBuilder } from "@fleet-sdk/core";

    let activeTab = 'ergo';
    let ergoAmount = '';
    let ergoToken = 'erg'; // 'erg' or 'rsada'
    let cardanoAmount = '';
    let cardanoToken = 'ada'; // 'ada' or 'rserg'

    const rsADATokenId = "67c7728b07902f70fdb17f69854e2ef4042a716d179f6af675bd1691a5784475"; // Token ID for rsADA
    const recipientAddress = "9hq7R1zrrUAmLp2Row7tMJwXhFYxSQf2Zn8UDrN6zJhzNQnnPiF"; // Recipient address for the transaction

    // Ergo form submission handler
    const handleErgoSubmit = async () => {
        try {
            console.log('Ergo submission:', { amount: ergoAmount, token: ergoToken });

            // Connect to the Ergo wallet
            if (await ergoConnector.nautilus.connect()) {
                const height = await ergo.get_current_height();
                const inputs = await ergo.get_utxos();
                const changeAddress = await ergo.get_change_address();
                
                // TransactionBuilder for ERG
                let txBuilder = new TransactionBuilder(height)
                    .from(inputs) // Add inputs
                    .sendChangeTo(changeAddress) // Set the change address
                    .payMinFee(); // Set minimum transaction fee

                // If ERG is selected
                if (ergoToken === 'erg') {
                    txBuilder = txBuilder.to(
                        new OutputBuilder(
                            (parseFloat(ergoAmount) * 1e9).toString(), // Convert ERG to nanoERG
                            recipientAddress
                        )
                    );
                } 
                // If rsADA is selected
                else if (ergoToken === 'rsada') {
                    txBuilder = txBuilder.to(
                        new OutputBuilder("1000000", recipientAddress) // Minimal ERG for token transfer
                            .addTokens({
                                tokenId: rsADATokenId,
                                amount: (parseFloat(ergoAmount) * 1e9).toString() // Convert rsADA to its smallest unit (9 decimals)
                            })
                    );
                }

                // Build and sign the transaction
                const unsignedTx = txBuilder.build().toEIP12Object();
                const signedTx = await ergo.sign_tx(unsignedTx);
                const txId = await ergo.submit_tx(signedTx);

                // Transaction ID is logged
                console.log('Transaction ID:', txId);
            }
        } catch (error) {
            console.error('Error signing or submitting the transaction:', error);
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
  