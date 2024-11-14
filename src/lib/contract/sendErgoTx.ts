// sendErgoTx.ts
import { OutputBuilder, TransactionBuilder, TokensCollection, SAFE_MIN_BOX_VALUE, ErgoAddress, RECOMMENDED_MIN_FEE_VALUE } from "@fleet-sdk/core";
import { RECIPIENT_ADDRESS_ERGO } from "$lib/common/const.js";
import { BigNumber } from 'bignumber.js';

export async function sendErgoTx(
    userBase58PK: string,
    userUtxos: Array<any>,
    assetName: string,
    amount: string, // Changed to string to prevent floating point issues
    height: number,
    campaignId: number,
    tokenId: string | null,
    recipientAddress: string,
    decimals: number
): any {
    const userAddress = ErgoAddress.fromBase58(userBase58PK);
    let ergValue = SAFE_MIN_BOX_VALUE;
  
    if (assetName === "ERG") {
        // User inputs 1 ERG, we convert to 1000000000 nanoERG
        ergValue = new BigNumber(amount).times(10 ** 9).integerValue();
    }

    const sendBox = new OutputBuilder(
        ergValue,
        recipientAddress
    );
    
    if (tokenId) {
        // User inputs 100 tokens, we convert to smallest unit based on decimals
        const tokenAmount = new BigNumber(amount).times(10 ** decimals).integerValue();
        console.log(`Converting ${amount} ${assetName} to ${tokenAmount} base units`);
        
        sendBox.addTokens(new TokensCollection([{
            tokenId: tokenId,
            amount: tokenAmount
        }]));
    }
  
    const unsignedTx = new TransactionBuilder(height)
        .configure((s) => s.setMaxTokensPerChangeBox(100))
        .configureSelector((selector) => 
            selector.ensureInclusion(userUtxos.map(utxo => utxo.boxId))
        )
        .from(userUtxos)
        .to([sendBox])
        .sendChangeTo(userAddress)
        .payFee(RECOMMENDED_MIN_FEE_VALUE)
        .build()
        .toEIP12Object();
  
    return unsignedTx;
}