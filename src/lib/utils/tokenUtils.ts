export interface TokenInfo {
    id: string;
    name: string;
    decimals: number;
}

export async function fetchTokenInfo(tokenId: string): Promise<TokenInfo | null> {
    try {
        const response = await fetch(`https://api.ergexplorer.com/tokens/byId`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ids: [tokenId] })
        });
        const data = await response.json();
        
        if (data.items && data.items.length > 0) {
            return {
                id: tokenId,
                name: data.items[0].name,
                decimals: data.items[0].decimals
            };
        }
        throw new Error('Token not found');
    } catch (error) {
        console.error('Token fetch error:', error);
        return null;
    }
}