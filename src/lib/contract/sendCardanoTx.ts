// sendCardanoTx.ts
import { BLOCKFROST_PROJECT_ID } from '$lib/common/const.js';
import { Lucid, Blockfrost, fromText } from "@lucid-evolution/lucid";
import BigNumber from "bignumber.js";

export async function sendCardanoTx(
    walletName: string, 
    assetName: string, 
    amount: string, // Changed to string to prevent floating point issues
    campaignId: number,
    policyId: string | null,
    tokenName: string | null,
    recipientAddress: string,
    decimals: number
) {
    const lucid = await Lucid(
        new Blockfrost(
            "https://cardano-mainnet.blockfrost.io/api/v0",
            BLOCKFROST_PROJECT_ID
        ),
        "Mainnet"
    );

    const api = await window.cardano[walletName].enable();
    lucid.selectWallet.fromAPI(api);
    
    let tx;
    if (assetName === 'ADA') {
        // User inputs 1 ADA, we convert to 1000000 lovelace
        const lovelaceAmount = new BigNumber(amount).times(10 ** 6).integerValue();
        console.log(`Converting ${amount} ADA to ${lovelaceAmount} lovelace`);

        tx = await lucid
            .newTx()
            .pay.ToAddress(
                recipientAddress,
                { lovelace: lovelaceAmount }
            )
            .complete();
    } else {
        // User inputs 100 tokens, we convert to smallest unit based on decimals
        const tokenAmount = new BigNumber(amount).times(10 ** decimals).integerValue();
        console.log(`Converting ${amount} ${assetName} to ${tokenAmount} base units`);

        tx = await lucid
            .newTx()
            .pay.ToAddress(
                recipientAddress,
                { [policyId + fromText(tokenName)]: tokenAmount }
            )
            .complete();
    }

    return tx;
}
