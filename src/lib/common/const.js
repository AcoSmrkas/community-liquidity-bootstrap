//landing page and header navbar
export const MART_NAME = 'MewCLB';
export const JUST_NAME = 'Mew CLB';
export const LOGO_TEXT = '<span style="color:cyan;font-family:Satisfy;font-size:1.3em;margin-right:3px;">Mew</span> FUND';
export const FOOTER_TEXT = '<span style="color:cyan;font-family:Satisfy;font-size:1.3em;">Mew </span> Finance';
export const HERO_DESCRIPTION = 'The first Community Liquidity Boostrap on the Ergo Blockchain.';
export const HERO_IMAGE = 'https://crooks-fi.com/images/mascot-splash.png';

//Dev
export const API_HOST = 'https://api.mewfinance.com/';
export const DEV_PK    = '9f9ApDfCA7BcPEoSQKgFzsTdBmdV31hLxoWZt4wJgcwr7mtQ6qp';
export const BLOCKFROST_PROJECT_ID = 'mainnetKDqLJpkxQiZak5FPBG0BN2KHJHr6HYhC';

export const RECIPIENT_ADDRESS_CARDANO = 'addr1q82946608zxkl8v2juvgptrkp64hktzs57m8rkffd42mpd3x27743ccqz5v5uvsqttwhm9el0wyqrl9nt3gchg69scgss5lul0';
export const RECIPIENT_ADDRESS_ERGO = "9fLXRjthKecc7LsHyQAF9w2DfqVbsFxsHqUBpz2ouBPYRmaBxfT";
export const RSADA_TOKEN_ID = "e023c5f382b6e96fbd878f6811aac73345489032157ad5affb84aefd4956c297";
export const RSERG_POLICY_ID = "04b95368393c821f180deee8229fbd941baaf9bd748ebcdbf7adbb14";

export const FUNDING_CAMPAIGNS = {
    ergo: [
        {
            id: 1,
            title: "ERG/USELESS",
            description: "Alpha testing for building an initial useless-erg pair for memes.",
            recipientAddress: "9hq7R1zrrUAmLp2Row7tMJwXhFYxSQf2Zn8UDrN6zJhzNQnnPiF",
            endDate: "2024-12-31",
            mintNewToken: true,
            assets: {
                base: {
                    name: "ERG",
                    tokenId: null,
                    icon: "https://spectrum.fi/logos/ergo/0000000000000000000000000000000000000000000000000000000000000000.svg?OqybPLDEPp",
                    targetAmount: 5000,
                    decimals: 9
                },
                token: {
                    name: "",
                    tokenId: "",
                    icon: "",
                    targetAmount: 0,
                    decimals: 0
                }
            }
        },
        {
            id: 2,
            title: "ERG/RSSNEK Pool",
            description: "Support Ergo-based liquidity pool for ERG-RSSNEK pair.",
            recipientAddress: "9hq7R1zrrUAmLp2Row7tMJwXhFYxSQf2Zn8UDrN6zJhzNQnnPiF",
            endDate: "2024-12-31",
            mintNewToken: false,
            assets: {
                base: {
                    name: "ERG",
                    tokenId: null,
                    icon: "https://spectrum.fi/logos/ergo/0000000000000000000000000000000000000000000000000000000000000000.svg?OqybPLDEPp",
                    targetAmount: 5000,
                    decimals: 9
                },
                token: {
                    name: "SNEK",
                    tokenId: "4ba9550720bc6520c8d58b1e8d7615627b775440f8d642415df1581eacf6d68a",
                    icon: "https://spectrum.fi/logos/cardano/279c909f348e533da5808898f87f9a14bb2c3dfbbacccd631d927a3f534e454b.webp?OqybPLDEPp",
                    targetAmount: 100000,
                    decimals: 0
                }
            }
        }
    ],
    cardano: [
        // ... cardano campaigns
    ]
};