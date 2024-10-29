// sendErgoTx.ts
import { OutputBuilder, TransactionBuilder, TokensCollection, SAFE_MIN_BOX_VALUE, ErgoAddress, RECOMMENDED_MIN_FEE_VALUE } from "@fleet-sdk/core";
import { RECIPIENT_ADDRESS, CF_TOKEN_ID } from "$lib/common/const.js";
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
  
    if (asset == "erg") {
      ergValue = new BigNumber(amount).times(10 ** 9);
    }

    const sendBox = new OutputBuilder(
      ergValue,
      RECIPIENT_ADDRESS
    );
//e023c5f382b6e96fbd878f6811aac73345489032157ad5affb84aefd4956c297
    if (asset == "rsada") {
      sendBox.addTokens(new TokensCollection(
        [{
          tokenId: CF_TOKEN_ID,
          amount: new BigNumber(amount).times(10 ** 4)
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