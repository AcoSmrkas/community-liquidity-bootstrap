import { first } from "@fleet-sdk/common";
import { ErgoAddress, OutputBuilder, RECOMMENDED_MIN_FEE_VALUE, SAFE_MIN_BOX_VALUE, TransactionBuilder, TokensCollection } from "@fleet-sdk/core";
import { SGroupElement, SBigInt, SSigmaProp, SByte, SColl } from "@fleet-sdk/serializer";
import { ERG_CONSOLIDATE_FEE, DEV_PK } from '../common//const.js';
import { stringToBytes } from "@scure/base";

export function consolidateTx(
  userBase58PK: string,
  userUtxos: Array<any>,
  height: number
): any {
  const userAddress = ErgoAddress.fromBase58(userBase58PK);

  const feeBox = new OutputBuilder(
    ERG_CONSOLIDATE_FEE * userUtxos.length,
    DEV_PK
  ).setAdditionalRegisters({
    R4: SColl(SByte, stringToBytes("utf8", "consolidate")).toHex()
  });

  const unsignedTx = new TransactionBuilder(height)
    .configure((s) => s.setMaxTokensPerChangeBox(100))
    .configureSelector(
      (selector) => selector.ensureInclusion(userUtxos.map(utxo => utxo.boxId)))
    .from(userUtxos)
    .to([feeBox])
    .sendChangeTo(userAddress)
    .payFee(RECOMMENDED_MIN_FEE_VALUE)
    .build()
    .toEIP12Object();

  return unsignedTx;
}
