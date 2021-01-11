export const APP_SLUG = 'ditto';

export const APP_TITLE = 'Ditto Staking';

export const CACHE_WALLET_KEY = 'wallet';

export const BORDER_RADIUS = 8;

export const IS_TESTNET = false; //~window.location.href.indexOf('testnet');

export const NETWORKS = {
  56: {
    stakingAddress: ~window.location.href.indexOf('beta')
      ? '0xEBB27125FdeAf15218DC4079C6528efB7f232019'
      : ~window.location.href.indexOf('test')
      ? '0x58673E13415Eb0443bd203ee48A554ac7462e673'
      : '0x27Da7Bc5CcB7c31baaeEA8a04CC8Bf0085017208',
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
