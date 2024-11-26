<script lang="ts">
    import { campaignTypes } from '$lib/components/types/campaign';
    
    export let data = {
        campaign_type: "crowdfund",
        title: "",
        description: "",
        start_date: "",
        end_date: "",
        website: "",
        whitepaper: "",
        telegram: "",
        twitter: "",
        discord: ""
    };

    function formatDateTimeForInput(date: Date): string {
        return date.toISOString().slice(0, 16);
    }

    // Set initial dates if not provided
    if (!data.start_date) {
        data.start_date = formatDateTimeForInput(new Date());
    }
    if (!data.end_date) {
        const defaultEndDate = new Date();
        defaultEndDate.setDate(defaultEndDate.getDate() + 7); // Default to 7 days from now
        data.end_date = formatDateTimeForInput(defaultEndDate);
    }
</script>

<div class="space-y-6">
    <!-- Campaign Type -->
    <div>
        <label class="block text-sm font-medium mb-2 text-[var(--main-color)]">Campaign Type</label>
        <select 
            bind:value={data.campaign_type}
            class="w-full p-3 rounded-lg bg-[var(--forms-bg)] border border-[var(--border-color)] 
                   focus:border-[var(--main-color)] focus:ring-1 focus:ring-[var(--main-color)] 
                   text-[var(--text-primary)]"
        >
            {#each campaignTypes as type}
                <option value={type.value}>{type.label}</option>
            {/each}
        </select>
    </div>

    <!-- Title -->
    <div>
        <label class="block text-sm font-medium mb-2 text-[var(--main-color)]">Title</label>
        <input 
            type="text" 
            bind:value={data.title}
            class="w-full p-3 rounded-lg bg-[var(--forms-bg)] border border-[var(--border-color)] 
                   focus:border-[var(--main-color)] focus:ring-1 focus:ring-[var(--main-color)] 
                   text-[var(--text-primary)]"
            placeholder="Campaign title"
        />
    </div>

    <!-- Description -->
    <div>
        <label class="block text-sm font-medium mb-2 text-[var(--main-color)]">Description</label>
        <textarea 
            bind:value={data.description}
            class="w-full p-3 rounded-lg bg-[var(--forms-bg)] border border-[var(--border-color)] 
                   focus:border-[var(--main-color)] focus:ring-1 focus:ring-[var(--main-color)] 
                   text-[var(--text-primary)] min-h-[120px]"
            rows="4"
            placeholder="Describe your campaign's purpose and goals"
        />
    </div>

    <!-- Dates -->
    <div class="grid grid-cols-2 gap-6">
        <div>
            <label class="block text-sm font-medium mb-2 text-[var(--main-color)]">Start Date</label>
            <input 
                type="datetime-local" 
                bind:value={data.start_date}
                class="w-full p-3 rounded-lg bg-[var(--forms-bg)] border border-[var(--border-color)] 
                       focus:border-[var(--main-color)] focus:ring-1 focus:ring-[var(--main-color)] 
                       text-[var(--text-primary)]"
            />
        </div>
        <div>
            <label class="block text-sm font-medium mb-2 text-[var(--main-color)]">End Date</label>
            <input 
                type="datetime-local" 
                bind:value={data.end_date}
                class="w-full p-3 rounded-lg bg-[var(--forms-bg)] border border-[var(--border-color)] 
                       focus:border-[var(--main-color)] focus:ring-1 focus:ring-[var(--main-color)] 
                       text-[var(--text-primary)]"
            />
        </div>
    </div>

    <!-- Social Links -->
    <div class="space-y-4">
        <h3 class="font-medium text-[var(--main-color)]">Social Links & Documentation</h3>
        
        <div class="grid grid-cols-2 gap-6">
            <div>
                <label class="block text-sm font-medium mb-2 text-[var(--main-color)]">Website</label>
                <input 
                    type="url" 
                    bind:value={data.website}
                    class="w-full p-3 rounded-lg bg-[var(--forms-bg)] border border-[var(--border-color)] 
                           focus:border-[var(--main-color)] focus:ring-1 focus:ring-[var(--main-color)] 
                           text-[var(--text-primary)]"
                    placeholder="https://"
                />
            </div>
            
            <div>
                <label class="block text-sm font-medium mb-2 text-[var(--main-color)]">Whitepaper</label>
                <input 
                    type="url" 
                    bind:value={data.whitepaper}
                    class="w-full p-3 rounded-lg bg-[var(--forms-bg)] border border-[var(--border-color)] 
                           focus:border-[var(--main-color)] focus:ring-1 focus:ring-[var(--main-color)] 
                           text-[var(--text-primary)]"
                    placeholder="https://"
                />
            </div>
            
            <div>
                <label class="block text-sm font-medium mb-2 text-[var(--main-color)]">Telegram</label>
                <input 
                    type="text" 
                    bind:value={data.telegram}
                    class="w-full p-3 rounded-lg bg-[var(--forms-bg)] border border-[var(--border-color)] 
                           focus:border-[var(--main-color)] focus:ring-1 focus:ring-[var(--main-color)] 
                           text-[var(--text-primary)]"
                    placeholder="t.me/username"
                />
            </div>
            
            <div>
                <label class="block text-sm font-medium mb-2 text-[var(--main-color)]">Twitter</label>
                <input 
                    type="text" 
                    bind:value={data.twitter}
                    class="w-full p-3 rounded-lg bg-[var(--forms-bg)] border border-[var(--border-color)] 
                           focus:border-[var(--main-color)] focus:ring-1 focus:ring-[var(--main-color)] 
                           text-[var(--text-primary)]"
                    placeholder="@username"
                />
            </div>
            
            <div>
                <label class="block text-sm font-medium mb-2 text-[var(--main-color)]">Discord</label>
                <input 
                    type="text" 
                    bind:value={data.discord}
                    class="w-full p-3 rounded-lg bg-[var(--forms-bg)] border border-[var(--border-color)] 
                           focus:border-[var(--main-color)] focus:ring-1 focus:ring-[var(--main-color)] 
                           text-[var(--text-primary)]"
                    placeholder="discord.gg/invite"
                />
            </div>
        </div>
    </div>
</div>

<style>
    /* Style select dropdown */
    select {
        appearance: none;
        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236c84a2' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
        background-position: right 0.5rem center;
        background-repeat: no-repeat;
        background-size: 1.5em 1.5em;
        padding-right: 2.5rem;
    }

    /* Dark theme adjustments for datetime input */
    input[type="datetime-local"] {
        color-scheme: dark;
    }

    /* Placeholder styling */
    ::placeholder {
        color: var(--text-secondary);
        opacity: 0.7;
    }

    /* Consistent focus styling */
    input:focus, 
    select:focus, 
    textarea:focus {
        outline: none;
        border-color: var(--main-color);
        box-shadow: 0 0 0 1px var(--main-color);
    }

    /* Custom scrollbar for textarea */
    textarea {
        scrollbar-width: thin;
        scrollbar-color: var(--main-color) var(--forms-bg);
    }

    textarea::-webkit-scrollbar {
        width: 8px;
    }

    textarea::-webkit-scrollbar-track {
        background: var(--forms-bg);
        border-radius: 4px;
    }

    textarea::-webkit-scrollbar-thumb {
        background-color: var(--main-color);
        border-radius: 4px;
        border: 2px solid var(--forms-bg);
    }

    /* Option styling */
    select option {
        background-color: var(--card-bg);
        color: var(--text-primary);
        padding: 8px;
    }
</style>