import { 
    OutputBuilder, 
    TransactionBuilder, 
    SAFE_MIN_BOX_VALUE,
    ErgoAddress,
    mint
} from "@fleet-sdk/core";
import { BigNumber } from 'bignumber.js';

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
    params: LPCreationParams
) {
    debugLog("Building initial mint transaction with params:", {
        utxos: userUtxos.length,
        height,
        ...params
    });

    const {
        userAddress,
        ergAmount,
        tokenAmount,
        tokenId,
        tokenDecimals,
        proxyAddress
    } = params;

    try {
        // Convert amounts to base units
        const ergNano = new BigNumber(ergAmount).times(10 ** 9).integerValue();
        const tokenBase = new BigNumber(tokenAmount).times(10 ** tokenDecimals).integerValue();

        debugLog("Converted amounts:", {
            ergNano: ergNano.toString(),
            tokenBase: tokenBase.toString()
        });

        // Calculate initial LP token supply based on geometric mean
        const lpTokenSupply = new BigNumber(Math.sqrt(
            ergNano.times(tokenBase).toNumber()
        )).integerValue();

        debugLog("LP token supply:", lpTokenSupply.toString());

        // Create LP token name
        const lpTokenName = `LP_${tokenId.slice(0, 8)}`;

        // Find input box to mint token from
        let inputSum = BigInt(0);
        const selectedInputs = [];
        const requiredErg = BigInt(SAFE_MIN_BOX_VALUE) + BigInt(1000000); // min value + fee

        for (const box of userUtxos) {
            selectedInputs.push(box);
            inputSum += BigInt(box.value);
            if (inputSum >= requiredErg) break;
        }

        if (inputSum < requiredErg) {
            throw new Error(`Insufficient ERG. Required: ${requiredErg.toString()}, Found: ${inputSum.toString()}`);
        }

        // Create minting box
        const outputBox = new OutputBuilder(
            BigInt(SAFE_MIN_BOX_VALUE),
            userAddress
        ).mintToken({
            amount: lpTokenSupply.toString(),
            name: lpTokenName,
            decimals: 9,
            description: `LP Token for ${ergAmount} ERG and ${tokenAmount} tokens`
        });

        debugLog("Created mint box configuration:", {
            address: userAddress,
            value: outputBox.value.toString(),
            tokens: outputBox.tokens
        });

        // Create transaction
        const tx = new TransactionBuilder(height)
            .from(selectedInputs)
            .to(outputBox)
            .sendChangeTo(userAddress)
            .payMinFee()
            .build();

        const txInfo = {
            inputs: tx.inputs.length,
            inputsTotal: tx.inputs.reduce((sum, input) => sum + BigInt(input.value), BigInt(0)),
            outputs: tx.outputs.length,
            outputsTotal: tx.outputs.reduce((sum, output) => sum + BigInt(output.value), BigInt(0)),
            fee: tx.fee
        };

        debugLog("Transaction details:", txInfo);
        
        return tx.toEIP12Object();
    } catch (error) {
        debugLog("Error in mint transaction:", error);
        throw error;
    }
}


export async function buildCreateLPTx(
    userUtxos: Array<any>,
    height: number,
    params: LPCreationParams,
    lpTokenId: string
) {
    debugLog("Building pool creation transaction with params:", {
        utxos: userUtxos.length,
        height,
        lpTokenId,
        ...params
    });

    const {
        userAddress,
        ergAmount,
        tokenAmount,
        tokenId,
        tokenDecimals,
        proxyAddress
    } = params;

    try {
        // Convert amounts to base units
        const ergNano = new BigNumber(ergAmount).times(10 ** 9).integerValue();
        const tokenBase = new BigNumber(tokenAmount).times(10 ** tokenDecimals).integerValue();

        debugLog("Pool amounts:", {
            ergNano: ergNano.toString(),
            tokenBase: tokenBase.toString()
        });

        // Find inputs with required tokens
        const tokenInput = userUtxos.find(box => 
            box.assets?.some(token => token.tokenId === tokenId && 
                BigInt(token.amount) >= BigInt(tokenBase.toString()))
        );

        const lpTokenInput = userUtxos.find(box =>
            box.assets?.some(token => token.tokenId === lpTokenId)
        );

        if (!tokenInput || !lpTokenInput) {
            throw new Error("Insufficient tokens for pool creation");
        }

        // Calculate total required ERG
        const requiredErg = BigInt(ergNano.toString());
        let selectedInputs = [tokenInput];
        if (tokenInput.boxId !== lpTokenInput.boxId) {
            selectedInputs.push(lpTokenInput);
        }

        // Add more inputs if needed for ERG
        let inputSum = selectedInputs.reduce((sum, box) => sum + BigInt(box.value), BigInt(0));
        for (const box of userUtxos) {
            if (selectedInputs.some(input => input.boxId === box.boxId)) continue;
            selectedInputs.push(box);
            inputSum += BigInt(box.value);
            if (inputSum >= requiredErg + BigInt(1000000)) break;
        }

        if (inputSum < requiredErg) {
            throw new Error(`Insufficient ERG. Required: ${requiredErg.toString()}, Found: ${inputSum.toString()}`);
        }

        debugLog("Selected pool inputs:", {
            count: selectedInputs.length,
            totalErg: inputSum.toString()
        });

        // Build pool box
        const poolBox = new OutputBuilder(
            requiredErg,
            proxyAddress
        )
        .addTokens([
            {
                tokenId: tokenId,
                amount: tokenBase.toString()
            },
            {
                tokenId: lpTokenId,
                amount: "1" // Tracking token
            }
        ]);

        debugLog("Created pool box:", {
            value: poolBox.value.toString(),
            tokens: poolBox.tokens
        });

        // Build transaction
        const txBuilder = new TransactionBuilder(height)
            .from(selectedInputs)
            .to(poolBox)
            .sendChangeTo(userAddress)
            .payMinFee();

        debugLog("Building pool creation transaction");
        const unsignedTx = txBuilder.build();

        debugLog("Built pool transaction:", {
            inputs: unsignedTx.inputs.length,
            outputs: unsignedTx.outputs.length,
            fee: unsignedTx.fee
        });

        return unsignedTx.toEIP12Object();
    } catch (error) {
        debugLog("Error in pool transaction:", error);
        throw error;
    }
}