import { get } from "svelte/store";
import { selected_wallet,
  connected_wallet_address,
  connected_wallet_addresses} from '$lib/store/store.ts';
import { showCustomToast, hexToUtf8 } from "$lib/utils/utils.js";

// Converts hex to bytes
async function convertToBech32m(hexAddress) {
  try {
    // Convert hex to Uint8Array
    const bytes = new Uint8Array(
      hexAddress.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
    );

    // Use the cardano-serialization-lib-browser to convert to Bech32m
    const { Address, BaseAddress, Bech32 } = await import('@emurgo/cardano-serialization-lib-browser');
    const address = Address.from_bytes(bytes);
    const bech32mAddress = address.to_bech32();

    return bech32mAddress;
  } catch (error) {
    console.error('Error converting to Bech32m:', error.message);
    throw error;
  }
}

const KEY_WALLET_TYPE = 'connected_wallet_ergo';
export const KEY_ADDRESS = 'connected_address_ergo';

export function reconnectWallet() {
  const walletName = localStorage.getItem(KEY_WALLET_TYPE);

  if (isWalletCardano(walletName)) {
    reconnectCardanoWallet();
  }

  if (isWalletErgo(walletName)) {
    reconnectErgoWallet();
  }
}

export function connectWallet(walletName, address = null) {
  if (isWalletCardano(walletName)) {
    return connectCardanoWallet(walletName, address);
  }

  if (isWalletErgo(walletName)) {
    return connectErgoWallet(walletName, address);
  }
}

export function disconnectWallet(walletName) {
  const clickEvent = new Event('click');
  document.dispatchEvent(clickEvent);

  if (isWalletCardano(walletName)) {
    return disconnectCardanoWallet();
  }

  if (isWalletErgo(walletName)) {
    return disconnectErgoWallet();
  }
}

export async function connectErgoWallet(walletName, address = null) {
  if (walletName != 'ergopay' && !window.ergoConnector[walletName]) {
    showCustomToast(`${walletName} not detected.`, 4000, 'warning');
    return;
  }

  const isConnected = await connectWalletErgo(walletName);
  if (isConnected) {
    if (walletName != 'ergopay') {
      connected_wallet_addresses.set(await ergo.get_used_addresses());

      let connectedAddresses = get(connected_wallet_addresses);

      if (address == null) {
        connected_wallet_address.set(connectedAddresses[0]);
        localStorage.setItem(KEY_ADDRESS, connectedAddresses[0]);
      } else {
        connected_wallet_address.set(address);
        localStorage.setItem(KEY_ADDRESS, address);
      }
    } else {
      localStorage.setItem(KEY_ADDRESS, get(connected_wallet_address));
      connected_wallet_addresses.set([get(connected_wallet_address)]);
    }

    selected_wallet.set(walletName);
    localStorage.setItem(KEY_WALLET_TYPE, walletName);
  }

  return isConnected;
}

async function connectWalletErgo(wallet) {
  if (wallet == 'ergopay') {
    const connected_address = get(connected_wallet_address);
    if (!connected_address) {
      return false;
    }

    return true;
  } else {
    if (!window.ergoConnector) {
      showCustomToast('Please install Nautilus Wallet', 4000, 'danger');
      return false;
    }

    if (window.ergo) {
      return true;
    }

    let walletConnected;
    try {
      walletConnected = await ergoConnector[wallet].connect();
    } catch {
      walletConnected = false;
    }

    return walletConnected;
  }
}

export async function disconnectErgoWallet() {
  const wallet = get(selected_wallet);
  selected_wallet.set('');
  const address = get(connected_wallet_address);
  connected_wallet_address.set('');
  connected_wallet_addresses.set([]);

  localStorage.removeItem(KEY_WALLET_TYPE);
  localStorage.removeItem(KEY_ADDRESS);

  if (!window.ergoConnector || wallet == 'ergopay') {
    return true;
  } else {
    await ergoConnector[wallet].disconnect();
  }
}

export async function reconnectErgoWallet() {
  const walletName = localStorage.getItem(KEY_WALLET_TYPE);
  const address = localStorage.getItem(KEY_ADDRESS);

  if (walletName) {
    if (walletName == 'ergopay') {
      selected_wallet.set(walletName);
      connected_wallet_address.set(address);
    } else {
      try {
        await connectErgoWallet(walletName, address);
        selected_wallet.set(walletName);
        connected_wallet_address.set(address);
      } catch {
        //gonna catch em all!
      }
    }
  }
}

export async function connectCardanoWallet(walletName, address = null) {
  if (!window.cardano[walletName]) {
    showCustomToast(`${walletName} not detected.`, 4000, 'warning');
    return;
  }

  const isConnected = await connectWalletCardano(walletName);
  if (isConnected) {
    const walletAPI = await window.cardano[walletName].enable();
    // Fetch used addresses (addresses previously involved in transactions)
    const addresses = await walletAPI.getUsedAddresses();

      for (let i = 0; i < addresses.length; i++) {
        addresses[i] = await convertToBech32m(addresses[i]);
      }

      connected_wallet_addresses.set(addresses);

      let connectedAddresses = get(connected_wallet_addresses);
      
      if (address == null) {
        connected_wallet_address.set(connectedAddresses[0]);
        localStorage.setItem(KEY_ADDRESS, connectedAddresses[0]);
      } else {
        connected_wallet_address.set(address);
        localStorage.setItem(KEY_ADDRESS, address);
      }

    selected_wallet.set(walletName);
    localStorage.setItem(KEY_WALLET_TYPE, walletName);
  }

  return isConnected;
}

async function connectWalletCardano(wallet) {
  if (!window.cardano) {
    showCustomToast('Please install supported Cardano wallet', 4000, 'danger');
    return false;
  }

  let walletConnected;
  try {
    walletConnected = await window.cardano[wallet].enable();
  } catch {
    walletConnected = false;
  }

  return walletConnected;
}

export async function disconnectCardanoWallet() {
  const wallet = get(selected_wallet);
  selected_wallet.set('');
  const address = get(connected_wallet_address);
  connected_wallet_address.set('');
  connected_wallet_addresses.set([]);

  localStorage.removeItem(KEY_WALLET_TYPE);
  localStorage.removeItem(KEY_ADDRESS);
}

export async function reconnectCardanoWallet() {
  const walletName = localStorage.getItem(KEY_WALLET_TYPE);
  const address = localStorage.getItem(KEY_ADDRESS);

  if (walletName) {
    try {
      await connectCardanoWallet(walletName, address);
      selected_wallet.set(walletName);
      connected_wallet_address.set(address);
    } catch {
      //gonna catch em all!
    }
  }
}

export function isWalletCardano(wallet) {
  return (
    wallet == 'nami'
    || wallet == 'eternl'
    || wallet == 'vespr'
  );
}

export function isWalletErgo(wallet) {
  return (
    wallet == 'ergopay'
    || wallet == 'nautilus'
  );
}