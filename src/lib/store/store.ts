import { API_HOST } from '$lib/common/const.js';
import { writable, get } from 'svelte/store';
import axios from 'axios';

const MEW_TIER = 'mew_tier';

export type Token = {
  amount: bigint,
  tokenId: string
}

export type UnconfirmedSale = {
  tokens: Array<Token>,
  seller: string,
  tx: any,
  transactionId: string,
  priceInErg: string,
  isErgPayment: boolean, // New field for buy widget
  assetTokenId: string | null // New field for buy widget
}

export const selected_wallet = writable('');
export const connected_wallet_address = writable('');
export const connected_wallet_addresses = writable([]);
export const utxos = writable([]);
export const assets = writable([]);
export const offers = writable([]);
export const offersPackage = writable([]);
export const offersSolo = writable([]);
export const offersMy = writable([]);
export const unconfirmed_sales: Writable<Array<UnconfirmedSale>> = writable([]);
export const assetsInfos = writable([]);
export const totalBoxes = writable(0);
export const showPleaseWaitModal = writable(false);