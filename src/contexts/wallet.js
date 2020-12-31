import React from 'react';
import { ethers } from 'ethers';
import {
  NETWORKS,
  READ_WEB3_PROVIDER,
  CACHE_WALLET_KEY,
  NETWORK_CHAIN_ID,
} from 'config';
import cache from 'utils/cache';
import STAKING_ABI from 'abis/staking.json';
import LP_ABI from 'abis/lp.json';
import ERC20_ABI from 'abis/erc20.json';

export const READ_PROVIDER = new ethers.providers.JsonRpcProvider(
  READ_WEB3_PROVIDER
);
export const { stakingAddress: STAKING_ADDRESS } = NETWORKS[NETWORK_CHAIN_ID];
export const READ_STAKING_CONTRACT = new ethers.Contract(
  STAKING_ADDRESS,
  STAKING_ABI,
  READ_PROVIDER
);

const WalletContext = React.createContext(null);

export function WalletProvider({ children }) {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [chainId, setChainId] = React.useState(null);

  const [lpName] = React.useState('CAKE-LP');
  const [lpAddress, setLpAddress] = React.useState(null);
  const [lpDecimals] = React.useState(18);

  const [dittoAddress, setDittoAddress] = React.useState(null);
  const [dittoDecimals] = React.useState(9);

  const [wrappedBNBDecimals] = React.useState(9);

  const [signer, setSigner] = React.useState(null);
  const [address, setAddress] = React.useState(null);

  const isOnWrongNetwork = React.useMemo(
    () => chainId && chainId !== NETWORK_CHAIN_ID,
    [chainId]
  );

  const stakingContract = React.useMemo(
    () =>
      !signer
        ? READ_STAKING_CONTRACT
        : new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, signer),
    [signer]
  );

  const lpContract = React.useMemo(
    () =>
      lpAddress &&
      new ethers.Contract(lpAddress, LP_ABI, signer || READ_PROVIDER),
    [signer, lpAddress]
  );

  const dittoContract = React.useMemo(
    () =>
      dittoAddress &&
      new ethers.Contract(dittoAddress, ERC20_ABI, signer || READ_PROVIDER),
    [signer, dittoAddress]
  );

  const wrappedBNBContract = React.useMemo(
    () =>
      new ethers.Contract(
        '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
        ERC20_ABI,
        signer || READ_PROVIDER
      ),
    [signer]
  );

  const startConnecting = () => setIsConnecting(true);
  const stopConnecting = () => setIsConnecting(false);

  async function connectToCached() {
    if (address) return;

    const cachedWallet = cache(CACHE_WALLET_KEY);
    if (cachedWallet) {
      const c = {
        metamask: connectMetamask,
        bsc: connectBsc,
        trust: connectTrust,
      };
      c[cachedWallet]();
    }
  }

  async function connectMetamask() {
    await window.ethereum.enable();
    cache(CACHE_WALLET_KEY, 'metamask');
    await setProvider(window.ethereum);
  }

  async function connectBsc() {
    if (!window.BinanceChain) return;
    await window.BinanceChain.enable();
    cache(CACHE_WALLET_KEY, 'bsc');
    await setProvider(window.BinanceChain);
  }

  async function connectTrust() {
    await window.ethereum.enable();
    if (!window.ethereum.isTrust) return;
    cache(CACHE_WALLET_KEY, 'trust');
    await setProvider(window.ethereum);
  }

  async function setProvider(web3Provider) {
    web3Provider.on('accountsChanged', () => {
      window.location.reload();
    });
    web3Provider.on('chainChanged', () => {
      window.location.reload();
    });
    // web3Provider.on('disconnect', () => {
    //   disconnect();
    // });
    const provider = new ethers.providers.Web3Provider(web3Provider);
    let { chainId: c } = await provider.getNetwork();
    // android trust wallet bug
    [56, 97].forEach(o => {
      if (parseInt(`0x${o}`, 16) === parseInt(c)) c = o;
    });
    setChainId(c);
    if (c === NETWORK_CHAIN_ID) {
      const signer = provider.getSigner();
      setSigner(signer);
      setAddress(await signer.getAddress());
      stopConnecting();
    }
  }

  async function disconnect() {
    cache(CACHE_WALLET_KEY, null);
    setSigner(null);
    setAddress(null);
    setChainId(null);
  }

  // async function loadLpInfo() {
  //   if (!lpContract) return;
  //   const [decimals, symbol] = await Promise.all([
  //     lpContract.decimals(),
  //     lpContract.symbol(),
  //   ]);
  //   setLpDecimals(decimals);
  //   setLpName(symbol);
  // }

  async function load() {
    const [lpAddress, dittoAddress] = await Promise.all([
      stakingContract.stakingToken(),
      stakingContract.getDistributionToken(),
      connectToCached(),
    ]);
    setLpAddress(lpAddress);
    setDittoAddress(dittoAddress);
    setIsLoaded(true);
  }

  // React.useEffect(() => {
  //   loadLpInfo();
  // }, [lpContract]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <WalletContext.Provider
      value={{
        isLoaded,

        chainId,
        signer,
        address,
        isOnWrongNetwork,

        lpAddress,
        lpContract,
        lpDecimals,
        lpName,

        dittoContract,
        dittoAddress,
        dittoDecimals,

        // cakeContract,
        // cakeAddress,
        cakeDecimals: 18,

        stakingContract,

        wrappedBNBContract,
        wrappedBNBDecimals,

        isConnecting,
        startConnecting,
        stopConnecting,
        disconnect,

        connectMetamask,
        connectBsc,
        connectTrust,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = React.useContext(WalletContext);
  if (!context) {
    throw new Error('Missing wallet context');
  }
  const {
    isLoaded,

    chainId,
    signer,
    address,
    config,
    isOnWrongNetwork,

    lpAddress,
    lpContract,
    lpDecimals,
    lpName,

    dittoContract,
    dittoAddress,
    dittoDecimals,

    cakeContract,
    cakeAddress,
    cakeDecimals,

    stakingContract,

    wrappedBNBContract,
    wrappedBNBDecimals,

    isConnecting,
    startConnecting,
    stopConnecting,
    disconnect,

    connectMetamask,
    connectBsc,
    connectTrust,
  } = context;

  return {
    isLoaded,

    chainId,
    signer,
    address,
    config,
    isOnWrongNetwork,

    lpAddress,
    lpContract,
    lpDecimals,
    lpName,

    dittoContract,
    dittoAddress,
    dittoDecimals,

    cakeContract,
    cakeAddress,
    cakeDecimals,

    stakingContract,

    wrappedBNBContract,
    wrappedBNBDecimals,

    isConnecting,
    startConnecting,
    stopConnecting,
    disconnect,

    connectMetamask,
    connectBsc,
    connectTrust,
  };
}
