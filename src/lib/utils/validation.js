export function validateCampaignForm(campaignData) {
    const errors = [];

    // Basic validation
    if (!campaignData.title) errors.push('Campaign title is required');
    if (!campaignData.description) errors.push('Campaign description is required');
    if (!campaignData.start_date) errors.push('Start date is required');
    if (!campaignData.end_date) errors.push('End date is required');
    
    if (campaignData.start_date && campaignData.end_date) {
        if (new Date(campaignData.start_date) >= new Date(campaignData.end_date)) {
            errors.push('End date must be after start date');
        }
    }

    // Type-specific validation
    switch (campaignData.campaign_type) {
        case 'crowdfund':
            if (!campaignData.recipient_address) errors.push('Recipient address is required');
            break;
            
        case 'mintpluslp':
            if (!campaignData.token_name) errors.push('Token name is required');
            if (campaignData.total_supply <= 0) errors.push('Total supply must be greater than 0');
            if (!campaignData.token_decimals) errors.push('Token decimals is required');
            break;
            
        case 'multiassetlp':
        case 'ergassetlp':
            if (!campaignData.secondary_token_id) errors.push('Secondary token is required');
            break;
    }

    // Common numeric validations
    if (campaignData.base_target_amount <= 0) errors.push('Target amount must be greater than 0');
    if (campaignData.min_contribution <= 0) errors.push('Minimum contribution must be greater than 0');
    if (campaignData.max_contribution <= campaignData.min_contribution) {
        errors.push('Maximum contribution must be greater than minimum');
    }

    return errors;
}