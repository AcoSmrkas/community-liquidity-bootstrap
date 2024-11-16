import { 
    OutputBuilder, 
    TransactionBuilder, 
    SAFE_MIN_BOX_VALUE,
    SByte,
} from "@fleet-sdk/core";
import { BigNumber } from 'bignumber.js';

const MAX_LP_SUPPLY = "9223372036854774784";
const FEE_FACTOR = "990";
const DEBUG = true;
const PROXY_ADDRESS = "5vSUZRZbdVbnk4sJWjg2uhL94VZWRg4iatK9VgMChufzUgdihgvhR8yWSUEJKszzV7Vmi6K8hCyKTNhUaiP8p5ko6YEU9yfHpjVuXdQ4i5p4cRCzch6ZiqWrNukYjv7Vs5jvBwqg5hcEJ8u1eerr537YLWUoxxi1M4vQxuaCihzPKMt8NDXP4WcbN6mfNxxLZeGBvsHVvVmina5THaECosCWozKJFBnscjhpr3AJsdaL8evXAvPfEjGhVMoTKXAb2ZGGRmR8g1eZshaHmgTg2imSiaoXU5eiF3HvBnDuawaCtt674ikZ3oZdekqswcVPGMwqqUKVsGY4QuFeQoGwRkMqEYTdV2UDMMsfrjrBYQYKUBFMwsQGMNBL1VoY78aotXzdeqJCBVKbQdD3ZZWvukhSe4xrz8tcF3PoxpysDLt89boMqZJtGEHTV9UBTBEac6sDyQP693qT3nKaErN8TCXrJBUmHPqKozAg9bwxTqMYkpmb9iVKLSoJxG7MjAj72SRbcqQfNCVTztSwN3cRxSrVtz4p87jNFbVtFzhPg7UqDwNFTaasySCqM";

interface MintLPParams {
    userAddress: string;
    tokenId: string;
}

interface CreatePoolParams {
    userAddress: string;
    ergAmount: string;
    tokenAmount: string;
    tokenId: string;
    tokenDecimals: number;
    lpTokenId: string;
}

function debugLog(...args) {
    if (DEBUG) {
        console.log('[LPBuilder]', ...args);
    }
}

export function buildMintLPTokenTx(
    userUtxos: Array<any>,
    height: number,
    params: MintLPParams
) {
    const { userAddress, tokenId } = params;

    try {
        debugLog("Building mint transaction");
        
        // We just need minimal ERG for minting
        const requiredErg = BigInt(SAFE_MIN_BOX_VALUE) + BigInt(1000000);
        
        // Select input box
        const inputBox = userUtxos.find(box => BigInt(box.value) >= requiredErg);
        if (!inputBox) {
            throw new Error(`Insufficient ERG for minting. Required: ${requiredErg.toString()}`);
        }

        // Create mint box
        const mintBox = new OutputBuilder(
            BigInt(SAFE_MIN_BOX_VALUE),
            userAddress
        )
        .mintToken({
            amount: MAX_LP_SUPPLY,
            name: `LP_${tokenId.slice(0, 8)}`,
            decimals: 9,
            description: `LP Token for ERG/${tokenId.slice(0, 8)}`
        });

        debugLog("Created mint box", {
            value: mintBox.value.toString(),
            tokens: mintBox.tokens
        });

        const unsignedTx = new TransactionBuilder(height)
            .from([inputBox])
            .to(mintBox)
            .sendChangeTo(userAddress)
            .payMinFee()
            .build();

        return unsignedTx.toEIP12Object();

    } catch (error) {
        debugLog("Error in mint transaction:", error);
        throw error;
    }
}

export function buildCreatePoolTx(
    userUtxos: Array<any>,
    height: number,
    params: CreatePoolParams
) {
    const {
        userAddress,
        ergAmount,
        tokenAmount,
        tokenId,
        tokenDecimals,
        lpTokenId
    } = params;

    try {
        debugLog("Building pool transaction");

        // Convert amounts
        const ergNano = new BigNumber(ergAmount).times(10 ** 9).integerValue();
        const actualTokenAmount = new BigNumber(tokenAmount).times(10 ** tokenDecimals).integerValue();

        debugLog("Amounts:", {
            ergNano: ergNano.toString(),
            actualTokenAmount: actualTokenAmount.toString()
        });

        // Find boxes with required tokens
        const lpTokenBox = userUtxos.find(box => 
            box.assets?.some(token => token.tokenId === lpTokenId)
        );

        const projectTokenBox = userUtxos.find(box => 
            box.assets?.some(token => 
                token.tokenId === tokenId && 
                BigInt(token.amount) >= BigInt(actualTokenAmount.toString())
            )
        );

        debugLog("Found boxes:", {
            lpTokenBox: lpTokenBox?.boxId,
            projectTokenBox: projectTokenBox?.boxId
        });

        if (!lpTokenBox) {
            throw new Error("LP token not found");
        }

        if (!projectTokenBox) {
            throw new Error(`Insufficient project tokens. Required: ${actualTokenAmount.toString()}`);
        }

        // Select inputs
        let selectedInputs = [lpTokenBox];
        if (lpTokenBox !== projectTokenBox) {
            selectedInputs.push(projectTokenBox);
        }

        // Add more inputs for ERG if needed
        let inputSum = selectedInputs.reduce((sum, box) => sum + BigInt(box.value), BigInt(0));
        for (const box of userUtxos) {
            if (selectedInputs.some(input => input.boxId === box.boxId)) continue;
            selectedInputs.push(box);
            inputSum += BigInt(box.value);
            if (inputSum >= BigInt(ergNano.toString()) + BigInt(2000000)) break;
        }

        if (inputSum < BigInt(ergNano.toString())) {
            throw new Error(`Insufficient ERG. Required: ${ergNano.toString()}`);
        }

        // Create pool box
        const poolBox = new OutputBuilder(
            BigInt(ergNano.toString()),
            PROXY_ADDRESS
        )
        .addTokens([
            {
                tokenId: tokenId,
                amount: actualTokenAmount.toString()
            },
            {
                tokenId: lpTokenId,
                amount: MAX_LP_SUPPLY
            }
        ])
        .setAdditionalRegisters({
            R4: { value: FEE_FACTOR, type: "SInt" }
        });

        debugLog("Created pool box", {
            value: poolBox.value.toString(),
            tokens: poolBox.tokens,
            registers: poolBox.registers
        });

        const unsignedTx = new TransactionBuilder(height)
            .from(selectedInputs)
            .to(poolBox)
            .sendChangeTo(userAddress)
            .payMinFee()
            .build();

        return unsignedTx.toEIP12Object();

    } catch (error) {
        debugLog("Error in pool transaction:", error);
        throw error;
    }
}