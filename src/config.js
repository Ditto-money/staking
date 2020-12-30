export const APP_SLUG = 'ditto';

export const APP_TITLE = 'Ditto Staking';

export const CACHE_WALLET_KEY = 'wallet';

export const BORDER_RADIUS = 8;

export const IS_TESTNET = false; //~window.location.href.indexOf('testnet');

export const NETWORKS = {
  56: {
    stakingAddress: '0x14bF1C9d2a9e5e79CdC166B1F4e2AD9DAc0E956F',
  },
  97: {
    stakingAddress: '',
  },
};

export const NETWORK_NAME = IS_TESTNET ? 'testnet' : 'mainnet';

export const NETWORK_CHAIN_ID = IS_TESTNET ? 97 : 56;

export const READ_WEB3_PROVIDER = IS_TESTNET
  ? 'https://data-seed-prebsc-1-s1.binance.org:8545'
  : 'https://bsc-dataseed1.binance.org:443';

export const EMPTY_CALL_DATA =
  '0x0000000000000000000000000000000000000000000000000000000000000001';

export const ROUTER_BASE_NAME = process.env.ROUTER_BASE_NAME;
