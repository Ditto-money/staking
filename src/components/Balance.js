import React from 'react';
import Promise from 'bluebird';
import * as ethers from 'ethers';
import { makeStyles } from '@material-ui/core/styles';
import ERC20_CONTRACT_ABI from 'abis/erc20.json';
import { formatUnits } from 'utils/big-number';
import { useWallet } from 'contexts/wallet';
import sleep from 'utils/sleep';

const useStyles = makeStyles(theme => ({
  container: {},
}));

export default function({ header, isETH, tokenAddress }) {
  const { signer } = useWallet();
  return !signer ? null : isETH ? (
    <ETH {...{ header }} />
  ) : (
    <ERC20 {...{ header, tokenAddress }} />
  );
}

function ETH({ header }) {
  const classes = useStyles();
  const { signer } = useWallet();
  const [balance, setBalance] = React.useState(ethers.BigNumber.from('0'));

  const load = async () => {
    setBalance(await signer.getBalance());
  };

  const subscribe = () => {
    const eventName = 'block';
    signer.provider.on(eventName, load);
    return () => {
      signer.provider.off(eventName, load);
    };
  };

  React.useEffect(() => {
    load();
    return subscribe(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    balance && (
      <div className={classes.container}>
        {header}: {formatUnits(balance, 18)} ETH
      </div>
    )
  );
}

function ERC20({ header, tokenAddress }) {
  const classes = useStyles();
  const [balance, setBalance] = React.useState(ethers.BigNumber.from('0'));
  const [decimals, setDecimals] = React.useState(null);
  const [symbol, setSymbol] = React.useState(null);
  const { address, signer } = useWallet();

  const contract = React.useMemo(
    () =>
      signer &&
      tokenAddress &&
      new ethers.Contract(tokenAddress, ERC20_CONTRACT_ABI, signer),
    [tokenAddress, signer]
  );

  const onBalanceChange = async (from, to) => {
    if (from === address || to === address) {
      await sleep(1000);
      setBalance(await contract.balanceOf(address));
    }
  };

  const load = async () => {
    if (!(contract && address)) return;
    const [decimals, symbol, balance] = await Promise.all([
      contract.decimals(),
      contract.symbol(),
      contract.balanceOf(address),
    ]);
    setDecimals(decimals);
    setSymbol(symbol);
    setBalance(balance);
  };

  const subscribe = () => {
    if (!contract) return () => {};
    const transferEvent = contract.filters.Transfer();
    contract.on(transferEvent, onBalanceChange);
    return () => {
      contract.off(transferEvent, onBalanceChange);
    };
  };

  React.useEffect(() => {
    load();
    return subscribe(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract, address]);

  return (
    symbol &&
    decimals &&
    balance && (
      <div className={classes.container}>
        {header}: {formatUnits(balance, decimals)} {symbol.toUpperCase()}
      </div>
    )
  );
}
