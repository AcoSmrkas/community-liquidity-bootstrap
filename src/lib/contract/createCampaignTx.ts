import { 
    OutputBuilder, 
    TransactionBuilder,
    ErgoAddress, 
    RECOMMENDED_MIN_FEE_VALUE
} from "@fleet-sdk/core";
import { MEW_FEE_ADDRESS_ERGO, MEW_CAMPAIGN_FEE } from "$lib/common/const.js";

export async function createCampaignTx(
    userBase58PK: string,
    userUtxos: Array<any>,
    height: number
): any {
    const userAddress = ErgoAddress.fromBase58(userBase58PK);

    const totalErgValue = MEW_CAMPAIGN_FEE;

    // Create campaign output box
    const campaignBox = new OutputBuilder(
        totalErgValue,
        MEW_FEE_ADDRESS_ERGO
    );
    
    const unsignedTx = new TransactionBuilder(height)
        .configure((s) => s.setMaxTokensPerChangeBox(100))
        .from(userUtxos)
        .to([campaignBox]) // Add both campaign and fee boxes
        .sendChangeTo(userAddress)
        .payFee(RECOMMENDED_MIN_FEE_VALUE)
        .build()
        .toEIP12Object();
  
    return unsignedTx;
}