import { first } from "@fleet-sdk/common";
import { ErgoAddress, OutputBuilder, RECOMMENDED_MIN_FEE_VALUE, SAFE_MIN_BOX_VALUE, TransactionBuilder, TokensCollection } from "@fleet-sdk/core";
import { SGroupElement, SBigInt, SSigmaProp, SByte, SColl } from "@fleet-sdk/serializer";
import { ERG_AIRDROP_FEE, ERG_AIRDROP_FIX_FEE, DEV_PK, MIN_ERG_VAL } from '../common//const.js';
import { stringToBytes } from "@scure/base";
import { BigNumber } from 'bignumber.js';

export function airdropTx(
  userBase58PK: string,
  userUtxos: Array<any>,
  height: number,
  data: Array<any>
): any {
  const userAddress = ErgoAddress.fromBase58(userBase58PK);

  const feeBox = new OutputBuilder(
    ERG_AIRDROP_FIX_FEE + (ERG_AIRDROP_FEE * data.length),
    DEV_PK
  ).setAdditionalRegisters({
    R4: SColl(SByte, stringToBytes("utf8", "airdrop")).toHex()
  });

  let outputs = [];

  for (let d of data) {
    let output = new OutputBuilder(
      MIN_ERG_VAL,
      d.address  
    );

    output.addTokens(new TokensCollection(
        [{
            tokenId: d.tokenId,
            amount: new BigNumber(d.amount).times(10 ** d.decimals)
        }]            
    ));

    outputs.push(output);
  }

  const unsignedMintTransaction = new TransactionBuilder(height)
    .configure((s) => s.setMaxTokensPerChangeBox(100))
    .from(userUtxos)
    .to([feeBox, ...outputs])
    .sendChangeTo(userAddress)
    .payFee(RECOMMENDED_MIN_FEE_VALUE)
    .build()
    .toEIP12Object();

  return unsignedMintTransaction;
}
