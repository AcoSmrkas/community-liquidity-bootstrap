<script lang="ts">
    import { onMount } from 'svelte';
    import { API_HOST } from '$lib/common/const.js';
    import axios from 'axios';
    import {buildMintLPTokenTx, buildCreateLPTx } from '$lib/contract/lpTxBuilder.ts';
    import { writable } from 'svelte/store';
    import { get } from "svelte/store";
  import { selected_wallet, connected_wallet_address } from '$lib/store/store.ts';
  import { fetchBoxes, getBlockHeight, updateTempBoxes } from '$lib/api-explorer/explorer.ts';
  import { showCustomToast } from "$lib/utils/utils.js";

    export const isAuthenticated = writable(false);

    let password = '';
    const correctPassword = 'mewmew';

    function handleLogin() {
        if (password === correctPassword) {
        isAuthenticated.set(true);
        } else {
        alert('Incorrect password!');
        }
    }
    
    let loading = true;

    const fetchStats = async () => {
        try {
            const data = (await axios.get(`${API_HOST}/clb/getStats`)).data;
        } catch (error) {
            console.error("Error fetching Ergo stats:", error);
        }
    };

    async function buildLp() {

    let myAddress, height, utxos;
    let unsignedMint = null;

    utxos = await fetchBoxes($connected_wallet_address);
      myAddress = await ergo.get_change_address();
      height = await ergo.get_current_height();
      
        try {
          
        unsignedMint = await buildMintLPTokenTx(utxos, height, myAddress); 
        } catch (e) {
          if (e.message && e.message.substr(0, 19) == 'Insufficient inputs') {
            showCustomToast(`Insufficient funds.`, 5000, 'danger');
            return;
          }

          console.error(e);
          showCustomToast(`Failed to submit TX.`, 5000, 'danger');
          return;
        }

      let signedMint;
      try {
        signedMint = await ergo.sign_tx(unsignedMint);
      } catch (e) {
        if (e.info && e.info == 'User rejected') {
          return;
        }

        console.error(e);
        showCustomToast(`Failed to submit TX.`, 5000, 'danger');
      }

      console.log(unsignedMint);
      console.log(signedMint);

      let unsignedLp;
      try {
        unsignedLp = await buildCreateLPTx([signedMint.outputs[0], signedMint.outputs[2]], height, myAddress);
      } catch (e) {
        if (e.message && e.message.substr(0, 19) == 'Insufficient inputs') {
          console.log(e.message);
          showCustomToast(`Insufficient funds.`, 5000, 'danger');
          return;
        }

        console.error(e);
        showCustomToast(`Failed to submit TX.`, 5000, 'danger');
        return;
      }

      let transactionId, signedLp;
      try {
        signedLp = await ergo.sign_tx(unsignedLp);

        let preMintTx = await ergo.submit_tx(signedMint);

        if (!preMintTx) {
          throw 'Premint TX failed.';
        }

        transactionId = await ergo.submit_tx(signedLp);
      } catch (e) {
        console.log(e);
      }
    }

    // Fetch stats on mount
    onMount(async () => {
        loading = true;
        await fetchStats();
        loading = false;
    });
</script>

<div class="container top-margin text-white">
    <div class="container mx-auto px-0 max-w-6xl">
        <h1 class="text-4xl font-bold text-white text-center mb-8">Panel</h1>

        {#if !$isAuthenticated}
        <div class="container text-center">
            <h1>Password Protected</h1>
            <input
              class="border border-gray-300 rounded-md px-4 py-2 mt-3 mb-4"
              type="password"
              bind:value={password}
              placeholder="Enter password"
            />
            <button class="btn btn-primary" on:click={handleLogin}>Login</button>
          </div>
        {:else if loading}
        <div class="flex justify-center items-center min-h-[400px]">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
        {:else}
        <div class="container text-center">
            <h1>Campaign Control</h1>
            <button class="btn btn-primary" on:click={buildLp}>Build LP</button>
          </div>
        {/if}
    </div>
</div>
