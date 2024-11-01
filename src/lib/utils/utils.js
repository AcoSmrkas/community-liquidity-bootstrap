import { get } from 'svelte/store';
import { selected_wallet, connected_wallet_address, showPleaseWaitModal } from "$lib/store/store";
import { isWalletCardano, isWalletErgo } from '$lib/common/wallet.ts';

let toastTimeout = null;

function getDecimals(value, additional = 1) {
  if (value < 0) {
    value *= -1;
  }

  value = value.toString();
  if (value.includes('e-')) {
    let eIndex = value.indexOf('e-');
    return value.substr(eIndex + 2);
  }

  let decimals = 2;
  value = value.split('.');
  if (value.length > 1) {
    let realSmall = value[1].split('-');
    if (realSmall.length > 1) {
      decimals = parseInt(realSmall[1]) + 1;
    } else {
      for (let j = 0; j < value[1].length; j++) {
        if (value[1][j] != '0') {
          decimals = j + additional;

          if (value[1].length > j + 1
            && value[1][j + 1] != '0') {
            decimals++;
          }

          break;
        }
      }
    }
  } else {
    decimals = 2;
  }

  if (decimals < 2) {
    decimals = 2;
  }

  return decimals;
}

export async function hexToUtf8(hex) {
  const bytes = new Uint8Array(
    hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
  );
  return new TextDecoder().decode(bytes);
}

export function nFormatter(num) {
  if (num == undefined) {
    return num;
  }

  num = Number(num);
  let digits = getDecimals(num);

  const lookup = [
    { value: 1, symbol: '' },
  //  { value: 1e3, symbol: "k" },
    { value: 1e6, symbol: 'M' },
    { value: 1e9, symbol: 'B' },
    { value: 1e12, symbol: 'T' },
    { value: 1e15, symbol: 'P' },
    { value: 1e18, symbol: 'E' }
  ];

  if (num > 10) {
    digits = 2;
  }

  let minimumFractionDigits = 2;
  if (digits < minimumFractionDigits) {
    minimumFractionDigits = digits;
  }

  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  var item = lookup.slice().reverse().find(function(item) {
    return num >= item.value;
  });
  
  return item ? (num / item.value).toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: minimumFractionDigits }).replace(rx, '$1') + item.symbol : num.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: minimumFractionDigits });
}


export function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function showCustomToast(text, time, type = 'default') {
  const toastElement = jQuery('#customToast');
  const toastBody = jQuery('#customToastBody');
  
  // Reset classes and styles
  toastElement.removeClass('bg-success bg-danger bg-warning bg-primary bg-info');
  toastBody.removeClass('text-white');
  
  // Set dark theme
  toastElement.addClass('bg-dark text-white');
  
  let icon = '';
  
  switch(type) {
    case 'success':
      icon = `<svg class="me-2" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle;">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" fill="#4CAF50"/>
          </svg>`;
      break;
    case 'error':
    case 'danger':
      icon = `<svg class="me-2" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle;">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="#F44336"/>
          </svg>`;
      break;
    case 'info':
      icon = `<svg class="me-2" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle;">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V11H13V17ZM13 9H11V7H13V9Z" fill="#2196F3"/>
          </svg>`;
      break;
    case 'warning':
      icon = `<svg class="me-2" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle;">
            <path d="M1 21H23L12 2L1 21ZM13 18H11V16H13V18ZM13 14H11V10H13V14Z" fill="#FFC107"/>
          </svg>`;
      break;
    default:
      break;
  }
  
  toastBody.html(`<div style="display: flex; align-items: center;">${icon}<span>${text}</span></div>`);
  
  toastElement.off('click');
  
  const toastLiveExample = document.getElementById('customToast');
  const toast = new bootstrap.Toast(toastLiveExample);
  toast.show();
  
  if (toastTimeout != null) {
    clearTimeout(toastTimeout);
    toastTimeout = null;
  }

  if (time > 0) {
    toastTimeout = setTimeout(() => {
      toast.hide();
    }, time);
  } else {
    toastElement.click(() => {
      toast.hide();
    });
  }
}

export async function getConnectedWalletAddress() {
  const selectedWalletErgo = get(selected_wallet);
  const connectedWalletAddress = get(connected_wallet_address);

  if (selectedWalletErgo && selectedWalletErgo != 'ergopay' && window.ergoConnector[selectedWalletErgo]?.isConnected) {
    return await ergo.get_change_address();
  } else if (selectedWalletErgo && selectedWalletErgo == 'ergopay') {
    return connectedWalletAddress;
  } else {
    return '';
  }
}

export function isWalletConected() {
  const selectedWallet = get(selected_wallet);

  if (isWalletErgo(selectedWallet)) {
  return ((selectedWallet && selectedWallet != 'ergopay'
    && window.ergoConnector[selectedWallet]?.isConnected)
    ||
    (selectedWallet && selectedWallet == 'ergopay'));
  } else if (isWalletCardano(selectedWallet)) {
    return selectedWallet && window.cardano[selectedWallet]?.isEnabled();
  }
}

export function formatNftUrl(r9RenderedValue) {
  let link = hex2a(r9RenderedValue);

  if (link.includes('ipfs://')) {
    link = link.replace('ipfs://', '');
    link = 'https://ipfs.blockfrost.dev/ipfs/' + link;
  } else if (link.includes('https://ipfs.infura.io')) {
    link = link.replace('https://ipfs.infura.io', 'https://ipfs.io');
  } else {
    link = 'https://gateway.pinata.cloud/ipfs/' + link;
  }

  return link;
}

export function hex2a(hexx) {
  if (hexx == undefined) {
    return undefined;
  }

  let hex = hexx.toString(); //force conversion
  let str = '';

  for (let i = 0; i < hex.length; i += 2) {
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  }

  return str;
}

export function getImageUrl(token) {
  let imageUrl;
  
  imageUrl = token.imageLink || `https://spectrum.fi/logos/ergo/${token.tokenId}.svg`;
  //console.log(`Default image: ${imageUrl} for token: ${token.name}`);
  
  return imageUrl;
}

export function setPlaceholderImage(e, asset) {
    let imgSrc = './default/token.png';

    if (asset.isImage) {
      imgSrc = './default/nft-image.png';
    }

    if (asset.isAudio) {
      imgSrc = './default/nft-audio.png';
    }

    if (asset.isVideo) {
      imgSrc = './default/nft-video.png';
    }

    jQuery(e.target).prop('src', imgSrc);
  }

export function destroy(e) {
  jQuery(e.currentTarget).remove();
}

export function truncateAddress(address) {
  return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'N/A';
}

export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

export function isMobileDevice() {
    return /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function showPleaseWait() {
  showPleaseWaitModal.set(true);
}

export function hidePleaseWait() {
  showPleaseWaitModal.set(false);
}

export function getCommonBoxIds(array1, array2) {
    // Create sets of boxIds from both arrays
    const set1 = new Set(array1.map(obj => obj.boxId));
    const set2 = new Set(array2.map(obj => obj.boxId));

    // Use filter and has method to find common boxIds
    return Array.from(set1).filter(boxId => set2.has(boxId));
}

export async function getErgPrice() {
    try {
        const ergResponse = await fetch('https://api.ergexplorer.com/tokens/getErgPrice');
        const ergData = await ergResponse.json();

        return ergData.items[0].value;
    } catch (error) {
      console.error('Error fetching Ergo price:', error);
      return null;
    }
}

export async function getCardanoPrice() {
  try {
      // Using CoinGecko API which is free and doesn't require an API key
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=cardano&vs_currencies=usd');
      
      if (!response.ok) {
          throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      
      // Extract ADA price in USD
      const adaPrice = data.cardano.usd;
      
      return adaPrice;
  } catch (error) {
      console.error('Error fetching Cardano price:', error);
      return null;
  }
}