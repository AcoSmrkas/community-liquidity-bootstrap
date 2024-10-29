<script>
	import '../bootstrap.css'
	import '../app.css';
	import { onMount } from 'svelte';
	import { reconnectWallet } from '$lib/common/wallet';
	import Navbar from '$lib/components/nav/Navbar.svelte';
	import Footer from '$lib/components/nav/Footer.svelte';
	import PleaseWait from '$lib/components/common/PleaseWait.svelte';

	onMount(async() => {
		await reconnectWallet();
	});
</script>

<Navbar />
<slot />
<Footer />
<PleaseWait />