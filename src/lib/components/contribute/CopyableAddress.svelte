<script>
    import { showCustomToast } from '$lib/utils/utils.js';
   
    export let label = '';
    export let address = '';
    export let maxWidth = '150px';
   
    function copyAddress() {
        navigator.clipboard.writeText(address);
        showCustomToast('Address copied', 2000, 'success');
    }
</script>

<div class="address-container">
    <div class="address-content">
        <span class="address-label">{label}:</span>
        <div class="address-value-container">
            <span class="address-value" style="max-width: {maxWidth}">{address}</span>
            <button
                class="copy-button"
                on:click={copyAddress}
            >
                <svg class="copy-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            </button>
        </div>
    </div>
</div>

<style>
    .address-container {
        background-color: var(--footer);
        padding: 0.75rem;
        border-radius: 0.5rem;
        margin-bottom: 1.5rem;
        border: 1px solid var(--main-color);
        transition: all 0.2s ease;
    }

    .address-container:hover {
        box-shadow: 0 0 0 1px var(--main-color);
    }

    .address-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .address-label {
        color: var(--main-color);
        font-size: 0.875rem;
        font-weight: 500;
    }

    .address-value-container {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .address-value {
        color: white;
        font-size: 0.875rem;
        font-family: monospace;
        truncate: true;
        display: inline-block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .copy-button {
        padding: 0.25rem;
        border-radius: 0.375rem;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: transparent;
        border: 1px solid transparent;
    }

    .copy-button:hover {
        background-color: var(--main-color);
        border-color: var(--main-color);
    }

    .copy-button:active {
        transform: scale(0.95);
    }

    .copy-icon {
        width: 1rem;
        height: 1rem;
        color: var(--main-color);
        transition: color 0.2s ease;
    }

    .copy-button:hover .copy-icon {
        color: white;
    }
</style>