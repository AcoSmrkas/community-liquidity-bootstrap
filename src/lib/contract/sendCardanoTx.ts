
import { RECIPIENT_ADDRESS_CARDANO } from '$lib/common/const.js';
import { Lucid, Blockfrost, fromText } from "@lucid-evolution/lucid";
import BigNumber from "bignumber.js";

export async function sendCardanoTx(walletName, asset, amount) {
    const lucid = await Lucid(
        new Blockfrost(
            "https://cardano-mainnet.blockfrost.io/api/v0", "mainnetKDqLJpkxQiZak5FPBG0BN2KHJHr6HYhC"),
        "Mainnet"
    );

    const api = await window.cardano[walletName].enable();
    lucid.selectWallet.fromAPI(api);
    
    let tx;
    if (asset == 'ada') {
        const lovelaceAmount = new BigNumber(amount).times(10 ** 6);

        tx = await lucid
            .newTx()
            .pay.ToAddress(
                RECIPIENT_ADDRESS_CARDANO,
                { lovelace: lovelaceAmount }
            )
            .complete();
    } else {
        const policyId = "04b95368393c821f180deee8229fbd941baaf9bd748ebcdbf7adbb14";
        const assetName = "rsERG";

        tx = await lucid
            .newTx()
            .pay.ToAddress(
                RECIPIENT_ADDRESS_CARDANO,
                { [policyId + fromText(assetName)]: amount }
            )
            .complete();
    }

    return tx;
}