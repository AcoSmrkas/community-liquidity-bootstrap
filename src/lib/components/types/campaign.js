export const campaignTypes = [
    { value: 'crowdfund', label: 'Crowdfund' },
    { value: 'mintpluslp', label: 'Token Mint + LP' },
    { value: 'multiassetlp', label: 'Multi Asset LP' },
    { value: 'ergassetlp', label: 'ERG Asset LP' }
];

export const defaultCampaignData = {
    campaign_type: "crowdfund",
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    min_contribution: 0,
    max_contribution: 0,
    base_name: "ERG",
    base_token_id: null,
    base_decimals: 9,
    base_target_amount: 0,
    recipient_address: "",
    token_name: "",
    token_description: "",
    token_decimals: 0,
    total_supply: 0,
    liquidity_info: "100%",
    lp_fee: 3,
    secondary_token_id: null,
    secondary_token_name: "",
    secondary_token_decimals: 0,
    secondary_token_amount: 0
};
