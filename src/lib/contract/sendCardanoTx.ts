
import { RECIPIENT_ADDRESS_CARDANO, RSERG_POLICY_ID, BLOCKFROST_PROJECT_ID } from '$lib/common/const.js';
import { Lucid, Blockfrost, fromText } from "@lucid-evolution/lucid";
import BigNumber from "bignumber.js";

export async function sendCardanoTx(walletName, asset, amount) {
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
    if (asset == 'ADA') {
        const lovelaceAmount = new BigNumber(amount).times(10 ** 6);

        tx = await lucid
            .newTx()
            .pay.ToAddress(
                RECIPIENT_ADDRESS_CARDANO,
                { lovelace: lovelaceAmount }
            )
            .complete();
    } else {
        const policyId = RSERG_POLICY_ID;
        const assetName = "rsERG";

        const nanoergamount = new BigNumber(amount).times(10 ** 9);

        tx = await lucid
            .newTx()
            .pay.ToAddress(
                RECIPIENT_ADDRESS_CARDANO,
                { [policyId + fromText(assetName)]: nanoergamount }
            )
            .complete();
    }

    return tx;
}