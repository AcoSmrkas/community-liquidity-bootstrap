import { OutputBuilder, TransactionBuilder, TokensCollection, SAFE_MIN_BOX_VALUE, ErgoAddress, RECOMMENDED_MIN_FEE_VALUE } from "@fleet-sdk/core";
import { RECIPIENT_ADDRESS_ERGO, RSADA_TOKEN_ID } from "$lib/common/const.js";
import { BigNumber } from 'bignumber.js';

export async function sendErgoTx(
    userBase58PK: string,
    userUtxos: Array<any>,
    asset: string,
    amount: number,
    height: number
  ): any {
    const userAddress = ErgoAddress.fromBase58(userBase58PK);
  
    let ergValue = SAFE_MIN_BOX_VALUE;
  
    if (asset == "ERG") {
      ergValue = new BigNumber(amount).times(10 ** 9);
    }

    const sendBox = new OutputBuilder(
      ergValue,
      RECIPIENT_ADDRESS_ERGO
    );
    
    if (asset == "rsADA") {
      sendBox.addTokens(new TokensCollection(
        [{
          tokenId: RSADA_TOKEN_ID,
          amount: new BigNumber(amount).times(10 ** 6)
        }]            
      ));
    }
  
    const unsignedTx = new TransactionBuilder(height)
      .configure((s) => s.setMaxTokensPerChangeBox(100))
      .configureSelector(
        (selector) => selector.ensureInclusion(userUtxos.map(utxo => utxo.boxId)))
      .from(userUtxos)
      .to([sendBox])
      .sendChangeTo(userAddress)
      .payFee(RECOMMENDED_MIN_FEE_VALUE)
      .build()
      .toEIP12Object();
  
    return unsignedTx;
  }