<script lang="ts">
    import { fetchTokenInfo } from '$lib/utils/tokenUtils';

    export let data = {
        // Base (First) Token Fields
        base_token_id: null,
        base_name: "",
        base_decimals: 0,
        base_target_amount: 0,
        min_contribution: 0,  // min for base token
        max_contribution: 0,  // max for base token
        
        // Secondary Token Fields
        token_id: null,
        token_name: "",
        token_decimals: 0,
        token_target_amount: 0,
        min_token: 0,        // min for secondary token
        max_token: 0,        // max for secondary token
        token_description: "",

        // LP Settings
        liquidity_info: "100%",
        lp_fee: 3
    };

    let loadingBaseTokenInfo = false;
    let loadingTokenInfo = false;
    let baseTokenInfo = null;
    let tokenInfo = null;

    async function handleBaseTokenIdInput(event: Event) {
        const tokenId = (event.target as HTMLInputElement).value.trim();
        
        if (tokenId && tokenId.length === 64) {
            loadingBaseTokenInfo = true;
            const fetchedToken = await fetchTokenInfo(tokenId);
            loadingBaseTokenInfo = false;
            
            if (fetchedToken) {
                baseTokenInfo = fetchedToken;
                data.base_name = fetchedToken.name;
                data.base_decimals = fetchedToken.decimals;
                data.base_token_id = tokenId;
            }
        }
    }

    async function handleTokenIdInput(event: Event) {
        const tokenId = (event.target as HTMLInputElement).value.trim();
        
        if (tokenId && tokenId.length === 64) {
            loadingTokenInfo = true;
            const fetchedToken = await fetchTokenInfo(tokenId);
            loadingTokenInfo = false;
            
            if (fetchedToken) {
                tokenInfo = fetchedToken;
                data.token_name = fetchedToken.name;
                data.token_decimals = fetchedToken.decimals;
                data.token_id = tokenId;
            }
        }
    }
</script>

<div class="space-y-6">
    <!-- First (Base) Token Selection -->
    <div>
        <label class="block text-sm font-medium mb-2 text-[var(--main-color)]">Base Token ID</label>
        <input 
            type="text"
            placeholder="Enter base token ID"
            on:input={handleBaseTokenIdInput}
            class="w-full p-3 rounded-lg bg-[var(--forms-bg)] border border-[var(--border-color)] 
                   focus:border-[var(--main-color)] focus:ring-1 focus:ring-[var(--main-color)] text-[var(--text-primary)]"
        />
        
        {#if loadingBaseTokenInfo}
            <div class="mt-2 text-[var(--main-color)] text-sm">Loading token information...</div>
        {:else if baseTokenInfo}
            <div class="mt-3 bg-[var(--card-bg)] p-4 rounded-lg border border-[var(--border-color)]">
                <h4 class="text-sm font-medium mb-2 text-[var(--main-color)]">Base Token Info</h4>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span class="text-[var(--text-secondary)]">Name:</span>
                        <span class="ml-2 text-[var(--text-primary)]">{baseTokenInfo.name}</span>
                    </div>
                    <div>
                        <span class="text-[var(--text-secondary)]">Decimals:</span>
                        <span class="ml-2 text-[var(--text-primary)]">{baseTokenInfo.decimals}</span>
                    </div>
                </div>
            </div>
        {/if}
    </div>

    <!-- Second Token Selection -->
    <div>
        <label class="block text-sm font-medium mb-2 text-[var(--main-color)]">Token ID</label>
        <input 
            type="text"
            placeholder="Enter token ID"
            on:input={handleTokenIdInput}
            class="w-full p-3 rounded-lg bg-[var(--forms-bg)] border border-[var(--border-color)] 
                   focus:border-[var(--main-color)] focus:ring-1 focus:ring-[var(--main-color)] text-[var(--text-primary)]"
        />
        
        {#if loadingTokenInfo}
            <div class="mt-2 text-[var(--main-color)] text-sm">Loading token information...</div>
        {:else if tokenInfo}
            <div class="mt-3 bg-[var(--card-bg)] p-4 rounded-lg border border-[var(--border-color)]">
                <h4 class="text-sm font-medium mb-2 text-[var(--main-color)]">Token Info</h4>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span class="text-[var(--text-secondary)]">Name:</span>
                        <span class="ml-2 text-[var(--text-primary)]">{tokenInfo.name}</span>
                    </div>
                    <div>
                        <span class="text-[var(--text-secondary)]">Decimals:</span>
                        <span class="ml-2 text-[var(--text-primary)]">{tokenInfo.decimals}</span>
                    </div>
                </div>
            </div>
        {/if}
    </div>

    <!-- Target Amounts -->
    <div class="grid grid-cols-2 gap-6">
        <div>
            <label class="block text-sm font-medium mb-2 text-[var(--main-color)]">
                Base Token Amount {baseTokenInfo?.name ? `(${baseTokenInfo.name})` : ''}
            </label>
            <input 
                type="number"
                bind:value={data.base_target_amount}
                class="w-full p-3 rounded-lg bg-[var(--forms-bg)] border border-[var(--border-color)] 
                       focus:border-[var(--main-color)] focus:ring-1 focus:ring-[var(--main-color)] text-[var(--text-primary)]"
                placeholder="Base token amount"
            />
        </div>
        <div>
            <label class="block text-sm font-medium mb-2 text-[var(--main-color)]">
                Token Amount {tokenInfo?.name ? `(${tokenInfo.name})` : ''}
            </label>
            <input 
                type="number"
                bind:value={data.token_target_amount}
                class="w-full p-3 rounded-lg bg-[var(--forms-bg)] border border-[var(--border-color)] 
                       focus:border-[var(--main-color)] focus:ring-1 focus:ring-[var(--main-color)] text-[var(--text-primary)]"
                placeholder="Token amount"
            />
        </div>
    </div>

    <!-- LP Settings -->
    <div class="grid grid-cols-2 gap-6">
        <div>
            <label class="block text-sm font-medium mb-2 text-[var(--main-color)]">Initial LP %</label>
            <select 
                bind:value={data.liquidity_info}
                class="w-full p-3 rounded-lg bg-[var(--forms-bg)] border border-[var(--border-color)] 
                       focus:border-[var(--main-color)] focus:ring-1 focus:ring-[var(--main-color)] text-[var(--text-primary)]"
            >
                <option value="100%">100%</option>
                <option value="75%">75%</option>
                <option value="50%">50%</option>
            </select>
        </div>
        <div>
            <label class="block text-sm font-medium mb-2 text-[var(--main-color)]">LP Fee %</label>
            <input 
                type="number"
                bind:value={data.lp_fee}
                class="w-full p-3 rounded-lg bg-[var(--forms-bg)] border border-[var(--border-color)] 
                       focus:border-[var(--main-color)] focus:ring-1 focus:ring-[var(--main-color)] text-[var(--text-primary)]"
                placeholder="e.g., 3"
            />
        </div>
    </div>

    <!-- Base Token Contribution Limits -->
    <div class="grid grid-cols-2 gap-6">
        <div>
            <label class="block text-sm font-medium mb-2 text-[var(--main-color)]">
                Min Base Contribution {baseTokenInfo?.name ? `(${baseTokenInfo.name})` : ''}
            </label>
            <input 
                type="number"
                bind:value={data.min_contribution}
                class="w-full p-3 rounded-lg bg-[var(--forms-bg)] border border-[var(--border-color)] 
                       focus:border-[var(--main-color)] focus:ring-1 focus:ring-[var(--main-color)] text-[var(--text-primary)]"
                placeholder="Minimum"
            />
        </div>
        <div>
            <label class="block text-sm font-medium mb-2 text-[var(--main-color)]">
                Max Base Contribution {baseTokenInfo?.name ? `(${baseTokenInfo.name})` : ''}
            </label>
            <input 
                type="number"
                bind:value={data.max_contribution}
                class="w-full p-3 rounded-lg bg-[var(--forms-bg)] border border-[var(--border-color)] 
                       focus:border-[var(--main-color)] focus:ring-1 focus:ring-[var(--main-color)] text-[var(--text-primary)]"
                placeholder="Maximum"
            />
        </div>
    </div>

    <!-- Token Contribution Limits -->
    <div class="grid grid-cols-2 gap-6">
        <div>
            <label class="block text-sm font-medium mb-2 text-[var(--main-color)]">
                Min Token Contribution {tokenInfo?.name ? `(${tokenInfo.name})` : ''}
            </label>
            <input 
                type="number"
                bind:value={data.min_token}
                class="w-full p-3 rounded-lg bg-[var(--forms-bg)] border border-[var(--border-color)] 
                       focus:border-[var(--main-color)] focus:ring-1 focus:ring-[var(--main-color)] text-[var(--text-primary)]"
                placeholder="Minimum"
            />
        </div>
        <div>
            <label class="block text-sm font-medium mb-2 text-[var(--main-color)]">
                Max Token Contribution {tokenInfo?.name ? `(${tokenInfo.name})` : ''}
            </label>
            <input 
                type="number"
                bind:value={data.max_token}
                class="w-full p-3 rounded-lg bg-[var(--forms-bg)] border border-[var(--border-color)] 
                       focus:border-[var(--main-color)] focus:ring-1 focus:ring-[var(--main-color)] text-[var(--text-primary)]"
                placeholder="Maximum"
            />
        </div>
    </div>

    <!-- Token Description -->
    <div>
        <label class="block text-sm font-medium mb-2 text-[var(--main-color)]">Token Description</label>
        <textarea 
            bind:value={data.token_description}
            class="w-full p-3 rounded-lg bg-[var(--forms-bg)] border border-[var(--border-color)] 
                   focus:border-[var(--main-color)] focus:ring-1 focus:ring-[var(--main-color)] text-[var(--text-primary)]"
            rows="3"
            placeholder="Describe the token"
        />
    </div>
</div>

<style>
    input[type="number"] {
        -moz-appearance: textfield;
    }
    input[type="number"]::-webkit-inner-spin-button,
    input[type="number"]::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    /* Placeholder styling */
    ::placeholder {
        color: var(--text-secondary);
        opacity: 0.7;
    }
</style>