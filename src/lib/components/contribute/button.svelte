<script>
    import { Clock, Lock } from 'lucide-svelte';

    export let status;
    export let startDate;
    export let onClick = () => {};
    export let loading = false;

    $: isActive = status === 'active';
    $: isUpcoming = status === 'upcoming';
    $: isEnded = status === 'ended';

    function formatDate(date) {
        return new Date(date).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }
</script>

<button
    class="btn btn-primary"
    on:click={onClick}
    disabled={!isActive || loading}
>
    {#if loading}
        Processing...
    {:else if isActive}
        Contribute
    {:else if isUpcoming}
        <Clock size={18} />
        Starts {formatDate(startDate)}
    {:else}
        <Lock size={18} />
        Campaign Ended
    {/if}
</button>

<style>
    .btn {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.5rem 1rem;
        font-size: 1rem;
        font-weight: 600;
        border: none;
        border-radius: 0.25rem;
        cursor: pointer;
        transition: background-color 0.3s ease;
    }

    .btn-primary {
        background-color: #007bff;
        color: white;
    }

    .btn-primary:hover {
        background-color: #0056b3;
    }

    .btn-primary:disabled {
        background-color: #6c757d;
        cursor: not-allowed;
    }
</style>
