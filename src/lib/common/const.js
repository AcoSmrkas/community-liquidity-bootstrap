//landing page and header navbar
export const MART_NAME = 'MewCLB';
export const JUST_NAME = 'Mew CLB';
export const LOGO_TEXT = '<span style="color:cyan;font-family:Satisfy;font-size:1.3em;margin-right:3px;">Mew</span> Fund';
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
export const MEW_FEE_ADDRESS_ERGO = "9gvDVNy1XvDeFoi4ZHn5v6u3tFRECMXGKbwuHbijJu6Z2hLQTQz";
export const MEW_FEE_ADDRESS_CARDANO = "addr1q82946608zxkl8v2juvgptrkp64hktzs57m8rkffd42mpd3x27743ccqz5v5uvsqttwhm9el0wyqrl9nt3gchg69scgss5lul0";
export const MEW_FEE_PERCENTAGE = 1; // 1% fee

// const.js

export const FUNDING_CAMPAIGNS = {
    ergo: [
        // Minting New Token (MemeToken)
        {
            id: 1,
            title: "MEOW Token Launch",
            description: "Community-driven meme token launch. 100% of raised ERG (minus platform fees) will be used for initial liquidity.",
            recipientAddress: "9hq7R1zrrUAmLp2Row7tMJwXhFYxSQf2Zn8UDrN6zJhzNQnnPiF",
            endDate: "2024-12-31",
            mintNewToken: true,
            tokenomics: {
                totalSupply: 1000000000, // 1 billion tokens
                initialPrice: 0.00001, // Price in ERG
                targetRaise: 10000, // ERG to raise
                minContribution: 5, // Min ERG per wallet
                maxContribution: 1000
            },
            status: {
                phase: "active",
                whitelistRequired: false,
                kycRequired: false
            },
            assets: {
                base: {
                    name: "ERG",
                    tokenId: null,
                    icon: "https://spectrum.fi/logos/ergo/0000000000000000000000000000000000000000000000000000000000000000.svg",
                    targetAmount: 10000, // ERG to raise
                    decimals: 9
                },
                token: {
                    name: "MEOW",
                    tokenId: "", // Will be generated during minting
                    icon: "path/to/meow/icon.svg",
                    targetAmount: 1000000000, // Total supply
                    decimals: 6
                }
            },
            links: {
                website: "https://meow.finance",
                telegram: "https://t.me/meowtoken",
                twitter: "https://twitter.com/meowtoken",
                github: "https://github.com/meowtoken"
            }
        },

        // Regular Token Launch with Split Allocation
        {
            id: 2,
            title: "MewFi Token Launch",
            description: "Initial DEX Offering for Mew Finance - The first cross-chain DEX aggregator built on Ergo.",
            recipientAddress: "9hq7R1zrrUAmLp2Row7tMJwXhFYxSQf2Zn8UDrN6zJhzNQnnPiF",
            endDate: "2024-12-31",
            mintNewToken: true,
            tokenomics: {
                totalSupply: 100000000, // 100 million tokens
                idoAllocation: 20000000, // 20% for IDO (20M tokens)
                initialPrice: 0.1, // Price in ERG
                targetRaise: 2000000, // 20M tokens * 0.1 ERG = 2M ERG
                minContribution: 10,
                maxContribution: 20000,
                vestingPeriod: "6 months",
                vestingSchedule: "Linear vesting over 6 months",
                liquidityAllocation: "40% of raised ERG for initial liquidity",
                liquidityLockPeriod: "12 months"
            },
            status: {
                phase: "upcoming",
                whitelistRequired: true,
                kycRequired: false
            },
            assets: {
                base: {
                    name: "ERG",
                    tokenId: null,
                    icon: "https://spectrum.fi/logos/ergo/0000000000000000000000000000000000000000000000000000000000000000.svg",
                    targetAmount: 2000000, // 2M ERG target
                    decimals: 9
                },
                token: {
                    name: "MEWFI",
                    tokenId: "", // Will be generated during minting
                    icon: "path/to/mewfi/icon.svg",
                    targetAmount: 20000000, // 20M tokens for IDO
                    decimals: 6
                }
            },
            links: {
                website: "https://mewfi.com",
                whitepaper: "https://docs.mewfi.com/whitepaper",
                telegram: "https://t.me/mewfi",
                twitter: "https://twitter.com/mewfi",
                github: "https://github.com/mewfi"
            }
        },

        // LP Creation Campaigns
        {
            id: 3,
            title: "ERG/NETA Liquidity Pool",
            description: "Support Ergo-based liquidity pool for ERG-NETA pair with additional yield farming rewards.",
            recipientAddress: "9hq7R1zrrUAmLp2Row7tMJwXhFYxSQf2Zn8UDrN6zJhzNQnnPiF",
            endDate: "2024-12-31",
            mintNewToken: false,
            tokenomics: {
                estimatedApy: 120, // Estimated APY
                farmingRewards: "MEWFI tokens",
                rewardsAllocation: "100,000 MEWFI tokens per month",
                lockPeriod: "3 months",
                minContribution: 10,
                maxContribution: 1000,
                rewardVestingPeriod: "No vesting, instant rewards"
            },
            status: {
                phase: "active",
                whitelistRequired: false,
                kycRequired: false
            },
            assets: {
                base: {
                    name: "ERG",
                    tokenId: null,
                    icon: "https://spectrum.fi/logos/ergo/0000000000000000000000000000000000000000000000000000000000000000.svg",
                    targetAmount: 10000,
                    decimals: 9
                },
                token: {
                    name: "NETA",
                    tokenId: "472c3d4ecaa08fb7392ff041ee2e6af75f4a558810a74b28600549d5392810e8",
                    icon: "path/to/neta/icon.svg",
                    targetAmount: 100000,
                    decimals: 6
                }
            },
            links: {
                website: "https://mewfi.com/farm",
                docs: "https://docs.mewfi.com/farming",
                telegram: "https://t.me/mewfi",
                twitter: "https://twitter.com/mewfi"
            }
        }
    ],
    cardano: [
        // Minting New Tokens
        {
            id: 5,
            title: "MewDAO Token Launch",
            description: "Decentralized governance token for the MewFi ecosystem on Cardano. Early supporters get exclusive voting rights and protocol rewards.",
            recipientAddress: "addr1q82946608zxkl8v2juvgptrkp64hktzs57m8rkffd42mpd3x27743ccqz5v5uvsqttwhm9el0wyqrl9nt3gchg69scgss5lul0",
            endDate: "2024-12-31",
            mintNewToken: true,
            tokenomics: {
                totalSupply: 100000000, // 100M tokens
                initialPrice: 0.5, // Price in ADA
                targetRaise: 500000, // ADA to raise
                minContribution: 0.1, // Min ADA
                maxContribution: 50000, // Max ADA
                liquidityInfo: "80% of raised ADA will be used for initial liquidity",
                liquidityLockPeriod: "12 months",
                vestingSchedule: "6 months linear vesting"
            },
            status: {
                phase: "active",
                whitelistRequired: true,
                kycRequired: true
            },
            assets: {
                base: {
                    name: "ADA",
                    tokenId: null,
                    icon: "https://cardanoscan.io/images/cardano.svg",
                    targetAmount: 500000,
                    decimals: 6
                },
                token: {
                    name: "MDAO",
                    policyId: "asset1deejmq8zf9uhnfyhv3fl6k09ara6pfxzvhnd00", // Will be generated during minting
                    icon: "path/to/mdao/icon.svg",
                    targetAmount: 100000000,
                    decimals: 0
                }
            },
            links: {
                website: "https://mewdao.com",
                whitepaper: "https://docs.mewdao.com/whitepaper",
                telegram: "https://t.me/mewdao",
                twitter: "https://twitter.com/mewdao",
                discord: "https://discord.gg/mewdao"
            }
        },
        {
            id: 6,
            title: "CatCoin Launch",
            description: "Community-driven meme token on Cardano with unique NFT integration and staking rewards.",
            recipientAddress: "addr1q82946608zxkl8v2juvgptrkp64hktzs57m8rkffd42mpd3x27743ccqz5v5uvsqttwhm9el0wyqrl9nt3gchg69scgss5lul0",
            endDate: "2024-12-31",
            mintNewToken: true,
            tokenomics: {
                totalSupply: 1000000000, // 1B tokens
                initialPrice: 0.001, // Price in ADA
                targetRaise: 100000, // ADA to raise
                minContribution: 50,
                maxContribution: 10000,
                liquidityInfo: "80% of raised ADA will be used for initial liquidity",
                liquidityLockPeriod: "12 months",
                vestingSchedule: "6 months linear vesting"
            },
            status: {
                phase: "upcoming",
                whitelistRequired: false,
                kycRequired: false
            },
            assets: {
                base: {
                    name: "ADA",
                    tokenId: null,
                    icon: "https://cardanoscan.io/images/cardano.svg",
                    targetAmount: 100000,
                    decimals: 6
                },
                token: {
                    name: "CATCOIN",
                    policyId: "",
                    icon: "path/to/catcoin/icon.svg",
                    targetAmount: 1000000000,
                    decimals: 6
                }
            },
            links: {
                website: "https://catcoin.finance",
                telegram: "https://t.me/catcoin",
                twitter: "https://twitter.com/catcoin",
                discord: "https://discord.gg/catcoin"
            }
        },

        // LP Creation Campaigns
        {
            id: 7,
            title: "ADA/MIN Liquidity Pool",
            description: "Provide liquidity for ADA-MIN pair with enhanced yield farming and MIN token rewards.",
            recipientAddress: "addr1q82946608zxkl8v2juvgptrkp64hktzs57m8rkffd42mpd3x27743ccqz5v5uvsqttwhm9el0wyqrl9nt3gchg69scgss5lul0",
            endDate: "2024-12-31",
            mintNewToken: false,
            tokenomics: {
                estimatedApy: 150,
                farmingRewards: "MIN + MDAO tokens",
                rewardsAllocation: "50,000 MIN + 10,000 MDAO per month",
                lockPeriod: "3 months",
                minContribution: 500,
                maxContribution: 100000,
                rewardVestingPeriod: "No vesting, instant rewards"
            },
            status: {
                phase: "active",
                whitelistRequired: false,
                kycRequired: false
            },
            assets: {
                base: {
                    name: "ADA",
                    tokenId: null,
                    icon: "https://cardanoscan.io/images/cardano.svg",
                    targetAmount: 200000,
                    decimals: 6
                },
                token: {
                    name: "MIN",
                    policyId: "8a1cfae21368b8bebbbed9800fec304e95cce39a2a57dc35e2e3ebaa",
                    icon: "path/to/min/icon.svg",
                    targetAmount: 1000000,
                    decimals: 6
                }
            },
            links: {
                website: "https://minswap.org",
                docs: "https://docs.minswap.org/farming",
                telegram: "https://t.me/minswap",
                twitter: "https://twitter.com/minswap",
                discord: "https://discord.gg/minswap"
            }
        },
        {
            id: 8,
            title: "ADA/AGIX Liquidity Pool",
            description: "High-APY liquidity pool for ADA-AGIX with bonus rewards in MDAO tokens.",
            recipientAddress: "addr1q82946608zxkl8v2juvgptrkp64hktzs57m8rkffd42mpd3x27743ccqz5v5uvsqttwhm9el0wyqrl9nt3gchg69scgss5lul0",
            endDate: "2024-12-31",
            mintNewToken: false,
            tokenomics: {
                estimatedApy: 180,
                farmingRewards: "AGIX + MDAO tokens",
                rewardsAllocation: "100,000 AGIX + 20,000 MDAO per month",
                lockPeriod: "1 month",
                minContribution: 1000,
                maxContribution: 200000,
                rewardVestingPeriod: "7 days"
            },
            status: {
                phase: "active",
                whitelistRequired: false,
                kycRequired: false
            },
            assets: {
                base: {
                    name: "ADA",
                    tokenId: null,
                    icon: "https://cardanoscan.io/images/cardano.svg",
                    targetAmount: 500000,
                    decimals: 6
                },
                token: {
                    name: "AGIX",
                    policyId: "f43a62fdc3965df486de8a0d32fe800963589c41b37093b6446a79f4",
                    icon: "path/to/agix/icon.svg",
                    targetAmount: 2000000,
                    decimals: 6
                }
            },
            links: {
                website: "https://singularitynet.io",
                docs: "https://docs.singularitynet.io/liquidity",
                telegram: "https://t.me/singularitynet",
                twitter: "https://twitter.com/singularitynet",
                discord: "https://discord.gg/singularitynet"
            }
        }
    ]
};