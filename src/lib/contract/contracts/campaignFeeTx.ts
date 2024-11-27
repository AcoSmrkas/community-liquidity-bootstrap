import {
    OutputBuilder,
    TransactionBuilder,
    SAFE_MIN_BOX_VALUE,
    ErgoAddress,
    RECOMMENDED_MIN_FEE_VALUE,
    SBigInt
} from "@fleet-sdk/core";
import { MEW_FEE_ADDRESS_ERGO } from "$lib/common/const.js";

// Campaign creation fee in ERG
const CAMPAIGN_CREATION_FEE = 5n * 1000000000n; // 5 ERG in nanoERG

export async function createCampaignFeeTx(
    userBase58PK: string,
    userUtxos: Array<any>,
    height: number
): any {
    const userAddress = ErgoAddress.fromBase58(userBase58PK);

    // Create fee output box
    const feeBox = new OutputBuilder(
        CAMPAIGN_CREATION_FEE,
        MEW_FEE_ADDRESS_ERGO
    ).setAdditionalRegisters({
        R4: "0x05", // Indicates this is a campaign creation fee
    });

    const unsignedTx = new TransactionBuilder(height)
        .from(userUtxos)
        .to([feeBox])
        .sendChangeTo(userAddress)
        .payFee(RECOMMENDED_MIN_FEE_VALUE)
        .build()
        .toEIP12Object();

    return unsignedTx;
}