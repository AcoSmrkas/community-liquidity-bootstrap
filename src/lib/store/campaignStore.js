import { writable } from 'svelte/store';

const STORAGE_KEY = 'ergo_campaigns';

function createCampaignStore() {
    const storedCampaigns = typeof window !== 'undefined' 
        ? JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
        : [];
    
    const { subscribe, set, update } = writable(storedCampaigns);

    return {
        subscribe,
        addCampaign: (campaign) => {
            update(campaigns => {
                const newCampaign = {
                    id: Date.now().toString(),
                    createdAt: new Date().toISOString(),
                    ...campaign
                };
                const updatedCampaigns = [...campaigns, newCampaign];
                if (typeof window !== 'undefined') {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCampaigns));
                }
                return updatedCampaigns;
            });
        },
        reset: () => {
            set([]);
            if (typeof window !== 'undefined') {
                localStorage.removeItem(STORAGE_KEY);
            }
        }
    };
}

export const campaigns = createCampaignStore();