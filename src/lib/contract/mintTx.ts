import { ErgoAddress, OutputBuilder, RECOMMENDED_MIN_FEE_VALUE, TransactionBuilder } from "@fleet-sdk/core";
import { DEV_PK, ERG_MINT_FEE, MIN_ERG_VAL } from '../common/const.js';
import { TokensCollection } from "@fleet-sdk/core";
import {  SConstant, SGroupElement, SInt, SLong, SSigmaProp, SByte, SColl, SPair, SUnit } from "@fleet-sdk/serializer";
import { BigNumber } from 'bignumber.js';
import { stringToBytes } from "@scure/base";

export function preMintTx(
  userUtxos: Array<any>,
  height: number,
  userAddress: string,
  royalties: Array<any>,
  traits: Array<any>,
  collection: string,
  explicit: boolean
): any {
  let properties = [];
  let levels = [];
  let stats = [];

  for (let i = 0; i < traits.length; i++) {
    let trait = traits[i];
    if (trait.type == 'property') {
      properties.push([stringToBytes("utf8", trait.key), stringToBytes("utf8", trait.value[0])]);
    } else if (trait.type == 'level') {
      levels.push([stringToBytes("utf8", trait.key), trait.value.filter(t => parseFloat(t))]);
    } else if (trait.type == 'stat') {
      stats.push([stringToBytes("utf8", trait.key), trait.value.filter(t => parseFloat(t))]);
    }
  }

  let royaltiesRegisterParam = [];

  for (let royalty of royalties) {
    const ergoTree = addressToErgoTree(royalty.address);

    royaltiesRegisterParam.push([ergoTree, royalty.percent * 10])
  }

  let royaltiesRegister = SColl(
    SPair(SColl(SByte), SInt),
    royaltiesRegisterParam
  ).toHex();

  let preMintValue = new BigNumber(MIN_ERG_VAL).plus(RECOMMENDED_MIN_FEE_VALUE).plus(ERG_MINT_FEE);

  if (collection && collection != "") {
    preMintValue = preMintValue.plus(MIN_ERG_VAL);
  }

  const preMintBox = new OutputBuilder(
    preMintValue,
    userAddress
  )
  .setAdditionalRegisters({
      R4: SInt(2).toHex(),
      R5: royaltiesRegister,
      R6: formatR6Data(properties, levels, stats).toHex(),
      R7: SColl(SByte, (collection == "" ? stringToBytes('utf8', collection) : collection)).toHex(),
      R8: SColl(
        SPair(SColl(SByte), SColl(SByte)),
        [[
          stringToBytes("utf8", "explicit"),
          (explicit ? [0x01] : [0x00])
        ]]
      ).toHex()
  });

  if (collection && collection != "") {
    preMintBox.addTokens(new TokensCollection(
      [{
        tokenId: collection,
        amount: 1
      }]            
    ));
  }

  const unsignedPreMintTransaction = new TransactionBuilder(height)
    .configure((s) => s.setMaxTokensPerChangeBox(100))
    .from(userUtxos)
    .to([preMintBox])
    .sendChangeTo(userAddress)
    .payFee(RECOMMENDED_MIN_FEE_VALUE)
    .build()
    .toEIP12Object();

  return unsignedPreMintTransaction;
}

export function collectionPreMint(
  userUtxos: Array<any>,
  height: number,
  userAddress: string,
  category: string,
  logoUrl: string,
  featureUrl: string,
  bannerUrl: string,
  instagram: string,
  twitter: string,
  mintLimit: number
): any {
  let preMintValue = new BigNumber(MIN_ERG_VAL).plus(RECOMMENDED_MIN_FEE_VALUE).plus(ERG_MINT_FEE);

  let r6Data = [];

  if (instagram && instagram != "") {
    r6Data.push([
      stringToBytes("utf8", "instagram"),
      stringToBytes("utf8", instagram)
    ]);
  }

  if (twitter && twitter != "") {
    r6Data.push([
      stringToBytes("utf8", "twitter"),
      stringToBytes("utf8", twitter)
    ]);
  }

  const preMintBox = new OutputBuilder(
    preMintValue,
    userAddress
  )
  .setAdditionalRegisters({
    R4: SInt(1).toHex(),
    R5: SColl(SColl(SByte),
      [
        logoUrl == "" ? "" : stringToBytes("utf8", logoUrl),
        featureUrl == "" ? "" : stringToBytes("utf8", featureUrl),
        bannerUrl == "" ? "" : stringToBytes("utf8", bannerUrl),
        stringToBytes("utf8", category)
      ]).toHex(),
    R6: SColl(
        SPair(SColl(SByte), SColl(SByte)),
        r6Data
      ).toHex(),
    R7: SLong(mintLimit).toHex(),
    R8: SColl(
      SPair(SColl(SByte), SColl(SByte)),
      [[
        stringToBytes("utf8", "category"),
        stringToBytes("utf8", category)
      ]]
    ).toHex()
  });

  const unsignedPreMintTransaction = new TransactionBuilder(height)
    .configure((s) => s.setMaxTokensPerChangeBox(100))
    .from(userUtxos)
    .to([preMintBox])
    .sendChangeTo(userAddress)
    .payFee(RECOMMENDED_MIN_FEE_VALUE)
    .build()
    .toEIP12Object();

  return unsignedPreMintTransaction;
}

export function mintTx(
  userUtxos: Array<any>,
  height: number,
  mintAmount: string, // Token amount as provided by the user
  tokenName: string,
  tokenDescription: string,
  tokenDecimals: number,
  userAddress: string,
  tokenType: string,
  registers: any,
  collection: string
): any {
  const feeBox = new OutputBuilder(
    ERG_MINT_FEE,
    DEV_PK
  ).setAdditionalRegisters({
    R4: SColl(SByte, stringToBytes("utf8", "mint")).toHex()
  });

  const mintBox = new OutputBuilder(MIN_ERG_VAL, userAddress)
  .mintToken({
    amount: mintAmount,
    name: tokenName,
    description: tokenDescription,
    decimals: tokenDecimals
  });

  if (tokenType != 'token' && Object.keys(registers).length > 0) {
    let additionalRegisters = {
      R4: SColl(SByte, stringToBytes("utf8", tokenName)).toHex(),
      R5: SColl(SByte, stringToBytes("utf8", tokenDescription)).toHex(),
      R6: SColl(SByte, stringToBytes("utf8", tokenDecimals.toString())).toHex()
    };

    if (registers.R7) {
      additionalRegisters.R7 = SColl(SByte, registers.R7).toHex()
    }

    if (registers.R8) {
      additionalRegisters.R8 = SColl(SByte, stringToBytes("utf8", registers.R8)).toHex()
    }

    if (registers.R9) {
      if (Array.isArray(registers.R9)) {
        additionalRegisters.R9 =
          SPair(
            SColl(SByte, stringToBytes("utf8", registers.R9[0])),
            SColl(SByte, stringToBytes("utf8", registers.R9[1]))
          ).toHex();
      } else {
        additionalRegisters.R9 = SColl(SByte, stringToBytes("utf8", registers.R9)).toHex()
      }
    }

    mintBox.setAdditionalRegisters(
      additionalRegisters
    );
  }

  let collectionBox = null;
  if (collection && collection != "") {
    collectionBox = new OutputBuilder(MIN_ERG_VAL, userAddress)
    .addTokens(new TokensCollection(
      [{
        tokenId: collection,
        amount: 1
      }]            
    ));
  }

  const unsignedMintTransaction = new TransactionBuilder(height)
    .configure((s) => s.setMaxTokensPerChangeBox(100))
    .from(userUtxos)
    .to([mintBox, feeBox, ...(collectionBox ? [collectionBox] : [])])
    .sendChangeTo(userAddress)
    .payFee(RECOMMENDED_MIN_FEE_VALUE)
    .build()
    .toEIP12Object();

  return unsignedMintTransaction;
}

function addressToErgoTree(addressString) {
  // Create an Address object from the base58 string
  const address = ErgoAddress.fromBase58(addressString);

  return address.ergoTree;
}

function formatR6Data(properties, levels, stats) {
  // Helper function to convert string to Coll[Byte]
  const strToCollByte = function (str) {
    return SColl(SByte, stringToBytes("utf8", str));
  }

  // Format properties
  const formattedProperties = SColl(
    SPair(SColl(SByte), SColl(SByte)),
    properties
  );

  // Format levels
  const formattedLevels = SColl(
    SPair(SColl(SByte), SPair(SInt, SInt)),
    levels
  );

  // Format stats
  const formattedStats = SColl(
    SPair(SColl(SByte), SPair(SInt, SInt)),
    stats
  );

  // Combine all into the final structure
  const r6Data = SPair(
    formattedProperties,
    SPair(formattedLevels, formattedStats)
  );

  return r6Data;
}