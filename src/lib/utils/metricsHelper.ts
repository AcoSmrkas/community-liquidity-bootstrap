// utils/metricsHelper.ts
export function calculateGlobalStats(campaigns) {
    return campaigns.reduce((stats, campaign) => {
      // Campaign Types
      stats.campaignTypes[campaign.type] = (stats.campaignTypes[campaign.type] || 0) + 1;
      
      // ERG Metrics
      stats.totalErgTarget += campaign.targets.erg || 0;
      stats.totalErgRaised += campaign.raised.erg || 0;
      
      // Token Metrics
      if (campaign.raised.token > 0) {
        stats.totalTokensRaised++;
        const tokenKey = campaign.targets.token_name;
        if (!stats.tokenMetrics[tokenKey]) {
          stats.tokenMetrics[tokenKey] = {
            raised: 0,
            target: 0
          };
        }
        stats.tokenMetrics[tokenKey].raised += campaign.raised.token;
        stats.tokenMetrics[tokenKey].target += campaign.targets.token;
      }
      
      // Success Rate
      if (campaign.status.is_successful) {
        stats.successfulCampaigns++;
      }
      
      // Contributor Metrics
      stats.totalContributors += campaign.contributions.unique;
      stats.totalContributions += campaign.contributions.total;
      
      return stats;
    }, {
      campaignTypes: {},
      totalErgTarget: 0,
      totalErgRaised: 0,
      totalTokensRaised: 0,
      tokenMetrics: {},
      successfulCampaigns: 0,
      totalContributors: 0,
      totalContributions: 0
    });
  }