<script lang="ts">
    import { HERO_DESCRIPTION, LOGO_TEXT, API_HOST } from '$lib/common/const.js';
    import { nFormatter } from '$lib/utils/utils.js';
    import { onMount } from 'svelte';
    import axios from "axios";
  
    let loading = true;
    let campaigns = [];
  
    async function fetchSuccessfulCampaigns() {
      try {
        console.log('Fetching successful campaigns...');
        const response = await axios.get(`${API_HOST}/mew/fund/GlobalStats`);
        console.log('API Response:', response.data);
  
        if (response.data?.items) {
          // Filter successful campaigns and sort by date
          campaigns = response.data.items
            .filter(campaign => campaign.status.is_successful)
            .sort((a, b) => new Date(b.timeline.first_contribution) - new Date(a.timeline.first_contribution));
          
          console.log('Processed Campaigns:', campaigns);
        }
      } catch (error) {
        console.error('Failed to fetch successful campaigns:', error);
      } finally {
        loading = false;
      }
    }
  
    function getTypeStyle(type: string) {
      const styles = {
        crowdfund: 'bg-blue-500/20 text-blue-400 border-blue-500/20',
        mintpluslp: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/20',
        multiassetlp: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20',
        ergassetlp: 'bg-purple-500/20 text-purple-400 border-purple-500/20'
      };
      return styles[type] || 'bg-gray-500/20 text-gray-400 border-gray-500/20';
    }
  
    onMount(() => {
      console.log('Component mounted');
      fetchSuccessfulCampaigns();
    });
  </script>
  
  <section class="max-w-7xl mx-auto px-4 py-16">
    <div class="text-center mb-12">
      <h2 class="text-3xl md:text-4xl font-bold text-white mb-4">Successful Campaigns</h2>
      <p class="text-gray-400 max-w-2xl mx-auto">
        Explore our successfully funded campaigns and their achievements
      </p>
    </div>
  
    {#if loading}
      <div class="flex justify-center items-center min-h-[200px]">
        <div class="text-gray-300">Loading campaigns...</div>
      </div>
    {:else if campaigns.length === 0}
      <div class="text-center text-gray-300 py-12">
        No successful campaigns found
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {#each campaigns as campaign (campaign.id)}
          <div class="campaign-card">
            <!-- Campaign Header -->
            <div class="p-6 border-b border-gray-700/50">
              <div class="flex justify-between items-start gap-4">
                <h3 class="text-xl font-bold text-white leading-tight">{campaign.title}</h3>
                <span class="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap {getTypeStyle(campaign.type)}">
                  {campaign.type}
                </span>
              </div>
            </div>
  
            <!-- Campaign Stats -->
            <div class="p-6 space-y-6">
              <!-- Amounts -->
              <div class="space-y-4">
                <div class="flex justify-between items-center">
                  <span class="text-gray-400">Target</span>
                  <div class="text-right">
                    <div class="text-white font-medium">{nFormatter(campaign.targets.erg)} ERG</div>
                    {#if campaign.targets.token > 0}
                      <div class="text-sm text-gray-400">
                        {nFormatter(campaign.targets.token)} {campaign.targets.token_name}
                      </div>
                    {/if}
                  </div>
                </div>
  
                <div class="flex justify-between items-center">
                  <span class="text-gray-400">Raised</span>
                  <div class="text-right">
                    <div class="text-green-400 font-medium">{nFormatter(campaign.raised.erg)} ERG</div>
                    {#if campaign.raised.token > 0}
                      <div class="text-sm text-green-400">
                        {nFormatter(campaign.raised.token)} {campaign.targets.token_name}
                      </div>
                    {/if}
                  </div>
                </div>
              </div>
  
              <!-- Contributors Stats -->
              <div class="grid grid-cols-2 gap-4">
                <div class="stat-box">
                  <div class="text-2xl font-bold text-white">{campaign.contributions.unique}</div>
                  <div class="text-sm text-gray-400">Contributors</div>
                </div>
                <div class="stat-box">
                  <div class="text-2xl font-bold text-white">{campaign.contributions.total}</div>
                  <div class="text-sm text-gray-400">Contributions</div>
                </div>
              </div>
  
              <!-- Timeline and Largest Contribution -->
              <div class="space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-400">Duration</span>
                  <span class="text-white">
                    {Math.floor(campaign.timeline.minutes_to_complete / 1440)}d 
                    {Math.floor((campaign.timeline.minutes_to_complete % 1440) / 60)}h
                  </span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-400">Largest Contribution</span>
                  <span class="text-white">{nFormatter(campaign.contributions.largest_erg)} ERG</span>
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </section>
  
  <style>
    .campaign-card {
      @apply bg-[var(--forms-bg)] rounded-xl overflow-hidden;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
  
    .campaign-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    }
  
    .stat-box {
      @apply bg-gray-800/30 rounded-xl p-4 text-center;
    }
  </style>