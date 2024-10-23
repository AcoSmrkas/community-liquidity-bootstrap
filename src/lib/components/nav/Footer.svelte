<script>
	import Modal from "$lib/components/common/Modal.svelte";
	import KYA from "$lib/components/common/KYA.svelte"
	import { onMount } from "svelte";
	import { FOOTER_TEXT } from '$lib/common/const.js';
	
	let showModal = false;

	onMount(()=>{
		const kya_accepted = localStorage.getItem('crooksmart_kya_accepted')
		if(!kya_accepted){
			showModal =  true;
		}
	})

	function acceptKya(){
	localStorage.setItem('crooksmart_kya_accepted', "true")
	}
</script>

<div class="w-full flex flex-col gap-2 justify-around p-1 shadow-md" style="background: var(--footer)">
	<div class="flex flex-grow justify-center text-light text-sm p-1 pt-3 pb-3 font-azeret">
		<p>© {@html FOOTER_TEXT} 2024</p>
	</div>
</div>

{#if showModal}
	<Modal bind:showModal onBtnClick={acceptKya}>
		<KYA></KYA>
		<span slot="btn">I understand and accept the KYA</span>
	</Modal>
{/if}

<style>
	button:hover{
		background: unset;
		color: unset;
	}
</style>
