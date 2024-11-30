<!-- CampaignFilter.svelte -->
<script>
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    export let selectedStatus;
    export let selectedType;
    
    const statusFilters = [
        { id: 'active', label: 'Active' },
        { id: 'upcoming', label: 'Upcoming' },
        { id: 'ended', label: 'Ended' }
    ];

    const typeFilters = [
        { id: 'all', label: 'All Types' },
        { id: 'mintpluslp', label: 'Mint+LP' },
        { id: 'multiassetlp', label: 'Multi LP' },
        { id: 'ergassetlp', label: 'ERG LP' },
        { id: 'crowdfund', label: 'Fund' }
    ];

    function handleStatusChange(newStatus) {
        selectedStatus = newStatus;
        dispatch('filterChange', { status: selectedStatus, type: selectedType });
    }

    function handleTypeChange(newType) {
        selectedType = newType;
        dispatch('filterChange', { status: selectedStatus, type: selectedType });
    }

    $: statusLabel = statusFilters.find(f => f.id === selectedStatus)?.label;
    $: typeLabel = typeFilters.find(f => f.id === selectedType)?.label;
</script>

<!-- Mobile View -->
<div class="md:hidden filter-container">
    <div class="flex gap-2">
        <!-- Status Dropdown -->
        <div class="relative flex-1">
            <select
                class="filter-select"
                value={selectedStatus}
                on:change={(e) => handleStatusChange(e.target.value)}
            >
                {#each statusFilters as filter}
                    <option value={filter.id}>{filter.label}</option>
                {/each}
            </select>
        </div>

        <!-- Type Dropdown -->
        <div class="relative flex-1">
            <select
                class="filter-select"
                value={selectedType}
                on:change={(e) => handleTypeChange(e.target.value)}
            >
                {#each typeFilters as filter}
                    <option value={filter.id}>{filter.label}</option>
                {/each}
            </select>
        </div>
    </div>
</div>

<!-- Desktop View -->
<div class="hidden md:block filter-container">
    <div class="filters-group">
        <div class="filter-section">
            <span class="filter-label">Status:</span>
            <div class="filter-buttons">
                {#each statusFilters as filter}
                    <button
                        class="filter-button"
                        class:active-status={selectedStatus === filter.id}
                        class:inactive-status={selectedStatus !== filter.id}
                        on:click={() => handleStatusChange(filter.id)}
                    >
                        {filter.label}
                    </button>
                {/each}
            </div>
        </div>

        <div class="filter-section">
            <span class="filter-label">Type:</span>
            <div class="filter-buttons">
                {#each typeFilters as filter}
                    <button
                        class="filter-button"
                        class:active-status={selectedType === filter.id}
                        class:inactive-status={selectedType !== filter.id}
                        on:click={() => handleTypeChange(filter.id)}
                    >
                        {filter.label}
                    </button>
                {/each}
            </div>
        </div>
    </div>
</div>

<style>
    .filter-container {
        width: 100%;
        padding: 0.75rem;
        background-color: var(--forms-bg);
        border-radius: 0.5rem;
        margin-bottom: 1rem;
    }

    .filter-select {
        width: 100%;
        padding: 0.5rem;
        border-radius: 0.5rem;
        background-color: rgba(255, 255, 255, 0.1);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.2);
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='white' viewBox='0 0 24 24'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 0.5rem center;
        background-size: 1.5rem;
        padding-right: 2rem;
    }

    .filters-group {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 2rem;
    }

    .filter-section {
        display: flex;
        align-items: center;
    }

    .filter-buttons {
        display: flex;
        gap: 0.5rem;
    }

    .filter-button {
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        font-size: 0.875rem;
        font-weight: 500;
        transition: all 0.2s;
    }

    .filter-label {
        color: rgb(209 213 219);
        font-size: 0.875rem;
        font-weight: 500;
        margin-right: 0.5rem;
    }

    .active-status {
        background-color: var(--main-color);
        color: var(--background);
    }

    .inactive-status {
        background-color: var(--forms-bg);
        color: rgb(209 213 219);
        border: 1px solid rgba(209, 213, 219, 0.2);
    }

    .inactive-status:hover {
        background-color: var(--main-color);
        color: var(--background);
    }

    /* Style for dropdown options */
    .filter-select option {
        background-color: var(--forms-bg);
        color: white;
        padding: 0.5rem;
    }
</style>