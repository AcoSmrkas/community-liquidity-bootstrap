// sendergotx.ts
import { OutputBuilder, TransactionBuilder } from "@fleet-sdk/core";
import { recipientAddress , Crownfundingtokenid } from "$lib/common/const.js"; // Import the recipient address from const.js



export const sendErgoTx = async (ergoToken: string, ergoAmount: string) => {
    try {
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
                            tokenId: Crownfundingtokenid,
                            amount: (parseFloat(ergoAmount) * 1e2).toString() // Convert rsADA to its smallest unit (9 decimals)
                        })
                );
            }

            // Build and sign the transaction
            const unsignedTx = txBuilder.build().toEIP12Object();
            const signedTx = await ergo.sign_tx(unsignedTx);
            const txId = await ergo.submit_tx(signedTx);

            // Return transaction ID
            return txId;
        }
    } catch (error) {
        console.error('Error signing or submitting the transaction:', error);
        throw new Error('Transaction failed');
    }
};
