import { 
    OutputBuilder, 
    TransactionBuilder, 
    TokensCollection, 
    SAFE_MIN_BOX_VALUE, 
    ErgoAddress, 
    RECOMMENDED_MIN_FEE_VALUE, 
    SBigInt
} from "@fleet-sdk/core";
import { MEW_FEE_ADDRESS_ERGO, MEW_FEE_PERCENTAGE } from "$lib/common/const.js";
import { BigNumber } from 'bignumber.js';

export async function sendErgoTx(
    userBase58PK: string,
    userUtxos: Array<any>,
    assetName: string,
    amount: string,
    height: number,
    campaignId: number,
    tokenId: string | null,
    recipientAddress: string,
    decimals: number
): any {
    const userAddress = ErgoAddress.fromBase58(userBase58PK);
    let totalErgValue = SAFE_MIN_BOX_VALUE;
    let feeValue = SAFE_MIN_BOX_VALUE;
  
    if (assetName === "ERG") {
        // Calculate total amount in nanoERG
        totalErgValue = new BigNumber(amount).times(10 ** 9);
        console.log(amount);
        console.log(totalErgValue);
        
        // Calculate fee amount (1%)
        feeValue = new BigNumber(totalErgValue).dividedBy(100).multipliedBy(MEW_FEE_PERCENTAGE);
    }

    // Create campaign output box
    const campaignBox = new OutputBuilder(
        totalErgValue,
        recipientAddress
    ).setAdditionalRegisters({
        R4: SBigInt(campaignId).toHex()
    });
    
    // Create fee output box
    const feeBox = new OutputBuilder(
        feeValue,
        MEW_FEE_ADDRESS_ERGO
    );
    
    if (tokenId) {
        // Handle token distribution
        const tokenAmount = new BigNumber(amount).times(10 ** decimals).integerValue();
        console.log(`Converting ${amount} ${assetName} to ${tokenAmount} base units`);
        
        campaignBox.addTokens(new TokensCollection([{
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
        .to([campaignBox, feeBox]) // Add both campaign and fee boxes
        .sendChangeTo(userAddress)
        .payFee(RECOMMENDED_MIN_FEE_VALUE)
        .build()
        .toEIP12Object();
  
    return unsignedTx;
}