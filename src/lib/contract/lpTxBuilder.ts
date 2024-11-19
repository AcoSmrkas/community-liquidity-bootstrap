import { ErgoAddress, OutputBuilder, RECOMMENDED_MIN_FEE_VALUE, TransactionBuilder } from "@fleet-sdk/core";

import { TokensCollection } from "@fleet-sdk/core";
import {  SConstant, SGroupElement, SInt, SLong, SSigmaProp, SByte, SColl, SPair, SUnit } from "@fleet-sdk/serializer";

import { BigNumber } from 'bignumber.js';
import { stringToBytes } from "@scure/base";

interface LPCreationParams {
    userAddress: string;
    ergAmount: string;
    tokenAmount: string;
    tokenId: string;
    tokenDecimals: number;
    proxyAddress: string;
    campaignId: number;
}

const DEBUG = true;

function debugLog(...args) {
    if (DEBUG) {
        console.log('[LPBuilder]', ...args);
    }
}

export async function buildMintLPTokenTx(
  userUtxos: Array<any>,
  height: number,
  userAddress: string
) {
    let tokenName = 'Mew Fund LP Token';
    const mintBox = new OutputBuilder(1000000, userAddress)
    .mintToken({
        amount: 9223372036854774807n,
        name: tokenName,
        description: '',
        decimals: 0
    });

    mintBox.setAdditionalRegisters({
        R4: SColl(SByte, stringToBytes("utf8", tokenName)).toHex()});

        const unsignedMintTransaction = new TransactionBuilder(height)
    .configure((s) => s.setMaxTokensPerChangeBox(100))
    .from(userUtxos)
    .to([mintBox])
    .sendChangeTo(userAddress)
    .payFee(RECOMMENDED_MIN_FEE_VALUE)
    .build()
    .toEIP12Object();

  return unsignedMintTransaction;
}


export async function buildCreateLPTx(
    userUtxos: Array<any>,
    height: number,
    userAddress: string
) {
    let tokenName = '';
    const mintBox = new OutputBuilder(100000000, '5vSUZRZbdVbnk4sJWjg2uhL94VZWRg4iatK9VgMChufzUgdihgvhR8yWSUEJKszzV7Vmi6K8hCyKTNhUaiP8p5ko6YEU9yfHpjVuXdQ4i5p4cRCzch6ZiqWrNukYjv7Vs5jvBwqg5hcEJ8u1eerr537YLWUoxxi1M4vQxuaCihzPKMt8NDXP4WcbN6mfNxxLZeGBvsHVvVmina5THaECosCWozKJFBnscjhpr3AJsdaL8evXAvPfEjGhVMoTKXAb2ZGGRmR8g1eZshaHmgTg2imSiaoXU5eiF3HvBnDuawaCtt674ikZ3oZdekqswcVPGMwqqUKVsGY4QuFeQoGwRkMqEYTdV2UDMMsfrjrBYQYKUBFMwsQGMNBL1VoY78aotXzdeqJCBVKbQdD3ZZWvukhSe4xrz8tcF3PoxpysDLt89boMqZJtGEHTV9UBTBEac6sDyQP693qT3nKaErN8TCXrJBUmHPqKozAg9bwxTqMYkpmb9iVKLSoJxG7MjAj72SRbcqQfNCVTztSwN3cRxSrVtz4p87jNFbVtFzhPg7UqDwNFTaasySCqM')
    .mintToken({
        amount: 1,
        name: null,
        description: null,
        decimals: 0
    });

    mintBox.setAdditionalRegisters({
        R4: SInt(990).toHex()});

    // Initialize BigNumber values
const value = new BigNumber(100000000).multipliedBy(1000); // 100000000000

// Compute the square root
const result = value.sqrt();

// Truncate the result if you want a `BigInt`-like integer value
const lpShare = result.integerValue(BigNumber.ROUND_DOWN);

console.log(userUtxos[0].assets[0].tokenId);
console.log(lpShare.toString());
console.log(userUtxos[0].assets[0].amount);
console.log(new BigNumber(9223372036854774807n).minus(lpShare).toString());

    mintBox.addTokens(new TokensCollection(
        [{
            tokenId: userUtxos[0].assets[0].tokenId,
            amount: new BigNumber(9223372036854774807n).minus(lpShare)
        },
        {
            tokenId: 'b0b312cde931c8bbdac0dac5bfd8e2c03bf4611275dc967988c8d15bd5ec20e0',
            amount: 1000
        }]            
        ));

    const lpChangeBox = new OutputBuilder(1000000, userAddress).addTokens(new TokensCollection(
        [{
            tokenId: userUtxos[0].assets[0].tokenId,            
            amount: lpShare
        }]
    ));

    const unsignedMintTransaction = new TransactionBuilder(height)
    .configure((s) => s.setMaxTokensPerChangeBox(100))
    .from(userUtxos)
    .to([mintBox, lpChangeBox])
    .sendChangeTo(userAddress)
    .payFee(RECOMMENDED_MIN_FEE_VALUE)
    .build()
    .toEIP12Object();

  return unsignedMintTransaction;
}

function bigIntSqrt(value) {
    if (value < 0n) throw new Error("Square root of negative numbers is not supported.");
    if (value < 2n) return value;

    let x = value;
    let y = (x + 1n) / 2n;
    while (y < x) {
        x = y;
        y = (x + value / x) / 2n;
    }
    return x;
}