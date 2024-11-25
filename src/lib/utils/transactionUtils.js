import { get } from "svelte/store";
import { showCustomToast } from './utils';
import { selected_wallet, connected_wallet_address } from "$lib/store/store";
import { fetchBoxes, getBlockHeight, updateTempBoxes } from '$lib/api-explorer/explorer';
import { BigNumber } from 'bignumber.js';
import { sendErgoTx } from "$lib/contract/sendErgoTx";
import { sendCardanoTx } from "$lib/contract/sendCardanoTx";

export async function handleErgoContribution(amount, selectedAsset, campaign, selectedWalletErgo) {
    try {
        let myAddress, height, utxos;

        if (selectedWalletErgo === 'ergopay') {
            myAddress = get(connected_wallet_address);
            utxos = await fetchBoxes(myAddress);
            height = await getBlockHeight();
        } else {
            myAddress = await ergo.get_change_address();
            utxos = await fetchBoxes(get(connected_wallet_address));
            height = await ergo.get_current_height();
        }

        const tokenId = selectedAsset.name === 'ERG' ? null : selectedAsset.tokenId;
        return await sendErgoTx(
            myAddress, utxos, selectedAsset.name, amount, height,
            campaign.id, tokenId, campaign.recipient_address,
            selectedAsset.decimals
        );
    } catch (e) {
        handleTransactionError(e);
        return null;
    }
}

export async function handleCardanoContribution(amount, selectedAsset, campaign, selectedWalletCardano) {
    try {
        const walletApi = await window.cardano[selectedWalletCardano].enable();
        if (!walletApi) throw new Error("Failed to enable wallet");

        return await sendCardanoTx(
            walletApi, selectedAsset.name, amount, campaign.id,
            selectedAsset.tokenId, selectedAsset.name, campaign.recipient_address,
            selectedAsset.decimals
        );
    } catch (e) {
        handleTransactionError(e);
        return null;
    }
}

export function handleTransactionError(e) {
    if (e.message?.includes('Insufficient')) {
        showCustomToast(`Insufficient funds.`, 5000, 'danger');
    } else if (e.info === 'User rejected' || (e.cause?.failure?.cause?.code === 2)) {
        // Handle user rejection silently
    } else {
        showCustomToast(`Failed to submit TX.`, 5000, 'danger');
    }
}