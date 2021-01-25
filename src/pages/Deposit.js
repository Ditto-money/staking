import React from 'react';
import * as ethers from 'ethers';
// import clsx from 'clsx';
// import moment from 'moment';
import { makeStyles } from '@material-ui/core/styles';
import { withRouter, Switch, Route, Redirect } from 'react-router-dom';
import {
  Box,
  // Paper,
  Button,
  TextField,
  Stepper,
  Step,
  StepLabel,
  Typography,
} from '@material-ui/core';
import { STAKING_ADDRESS, useWallet } from 'contexts/wallet';
import { useNotifications } from 'contexts/notifications';
import Balance from 'components/Balance';
import {
  formatUnits,
  // Big,
  isZero,
  // toFixed
} from 'utils/big-number';
import { BORDER_RADIUS, EMPTY_CALL_DATA } from 'config';
import ERC20_CONTRACT_ABI from 'abis/erc20.json';
import sleep from 'utils/sleep';
// import { useStats } from 'contexts/stats';

export const useStyles = makeStyles(theme => ({
  container: {
    '& a': {
      color: theme.palette.secondary.main,
    },
    '& .MuiInputLabel-shrink': {
      right: 0,
      transform: 'translate(0, 1.5px) scale(1)',
      transformOrigin: 'top left',
      fontSize: 12,
    },
  },
  maxButton: {
    height: 35,
  },
  depositButton: {
    width: 200,
  },
  rewards: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    padding: 20,
    borderRadius: BORDER_RADIUS,
    background: '#555',
    color: 'white',
  },
}));

const STEPS = ['Get Liquidity Pool Tokens', 'Stake'];

export default withRouter(function() {
  const classes = useStyles();
  const activeStep = ~window.location.hash.indexOf('2') ? 1 : 0;

  return (
    <Box className={classes.container}>
      <Stepper activeStep={activeStep}>
        {STEPS.map(label => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box mx={5} mb={4}>
        <Switch>
          <Route exact path={'/deposit/2'} component={Deposit} />
          <Route exact path={'/deposit/1'} component={GetLPTokens} />
          <Redirect to={'/deposit/1'} />
        </Switch>
      </Box>
    </Box>
  );
});

function GetLPTokens({ history }) {
  const classes = useStyles();
  const {
    startConnecting: startConnectingWallet,
    lpName,
    lpAddress,
    lpDecimals,
    dittoAddress,
    address,
    signer,
  } = useWallet();
  const [balance, setBalance] = React.useState(ethers.BigNumber.from('0'));

  const contract = React.useMemo(
    () =>
      signer &&
      lpAddress &&
      new ethers.Contract(lpAddress, ERC20_CONTRACT_ABI, signer),
    [lpAddress, signer]
  );

  const onBalanceChange = async (from, to) => {
    if (from === address || to === address) {
      await sleep(500);
      setBalance(await contract.balanceOf(address));
    }
  };

  const connectWalletOrNext = async () => {
    !address ? startConnectingWallet() : history.push('/deposit/2');
  };

  const load = async () => {
    if (!(contract && address)) return;
    const balance = await contract.balanceOf(address);
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

  return !(dittoAddress && lpAddress) ? null : (
    <>
      {!address ? null : (
        <Box mt={2}>
          <Typography variant="h5">
            You have ≈ {formatUnits(balance, lpDecimals)} {lpName} Tokens.
          </Typography>
        </Box>
      )}

      <Box mt={2}>
        Get {!address ? `Liquidity Pool Tokens (${lpName})` : 'more'} by
        providing liquidity to the DITTO-BNB Pool over{' '}
        <a
          href={`https://exchange.pancakeswap.finance/#/add/ETH/${dittoAddress}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          here
        </a>
        .
      </Box>

      <Box mt={2}>
        <Button
          color="secondary"
          variant="contained"
          onClick={connectWalletOrNext}
          className={classes.depositButton}
        >
          {!address ? 'Connect Wallet' : 'Stake →'}
        </Button>
      </Box>
    </>
  );
}

function Deposit() {
  const classes = useStyles();

  const {
    startConnecting: startConnectingWallet,
    signer,
    address,
    stakingContract,
    lpContract,
    lpDecimals,
    lpName,
    lpAddress,
  } = useWallet();

  // const {
  //   monthlyUnlockRate,
  //   totalStakingShares,
  //   totalStaked,
  //   totalStakingShareSeconds,
  //   totalStakedFor,
  //   userStakingShareSeconds,
  //   stakingEndSec,
  // } = useStats();

  const [isApproving, setIsApproving] = React.useState(false);
  const [isApproved, setIsApproved] = React.useState(false);
  const [isDepositing, setIsDepositing] = React.useState(false);

  const { showTxNotification, showErrorNotification } = useNotifications();
  const [inputAmount, setInputAmount] = React.useState(0);
  const [depositMaxAmount, setDepositMaxAmount] = React.useState(false);
  const [maxDepositAmount, setMaxDepositAmount] = React.useState(
    ethers.BigNumber.from('0')
  );
  const depositAmount = React.useMemo(() => {
    let inputAmountBN;
    try {
      inputAmountBN = ethers.utils.parseUnits(
        inputAmount.toString(),
        lpDecimals
      );
    } catch (e) {
      inputAmountBN = ethers.BigNumber.from('0');
    }
    return depositMaxAmount ? maxDepositAmount : inputAmountBN;
  }, [inputAmount, maxDepositAmount, depositMaxAmount, lpDecimals]);

  const onConnectOrApproveOrDeposit = async () => {
    if (!signer) {
      return startConnectingWallet();
    }
    !isApproved ? approve() : deposit();
  };

  const approve = async () => {
    try {
      setIsApproving(true);
      const tx = await lpContract.approve(STAKING_ADDRESS, depositAmount);
      showTxNotification(`Approving ${lpName}`, tx.hash);
      await tx.wait();
      showTxNotification(`Approved ${lpName}`, tx.hash);
      await checkAllowance();
    } catch (e) {
      showErrorNotification(e);
    } finally {
      setIsApproving(false);
    }
  };

  const deposit = async () => {
    try {
      if (depositAmount.isZero())
        return showErrorNotification('Enter deposit amount.');
      if (!depositMaxAmount && depositAmount.gt(maxDepositAmount)) {
        return showErrorNotification(
          'You are trying to deposit more than your actual balance.'
        );
      }
      setIsDepositing(true);
      const tx = await stakingContract.stake(depositAmount, EMPTY_CALL_DATA);
      showTxNotification(`Depositing ${lpName}`, tx.hash);
      await tx.wait();
      showTxNotification(`Deposited ${lpName}`, tx.hash);
      onSetDepositMaxAmount();
    } catch (e) {
      showErrorNotification(e);
    } finally {
      setIsDepositing(false);
    }
  };

  const checkAllowance = async () => {
    if (!(lpContract && address)) return setIsApproved(true);
    const allowance = await lpContract.allowance(address, STAKING_ADDRESS);
    setIsApproved(allowance.gte(depositAmount));
  };

  // const monthlyDittoRewards = React.useMemo(() => {
  //   if (
  //     !(
  //       depositAmount &&
  //       !isZero(monthlyUnlockRate) &&
  //       !isZero(totalStakingShares) &&
  //       !isZero(totalStaked) &&
  //       totalStakingShareSeconds &&
  //       totalStakedFor &&
  //       userStakingShareSeconds &&
  //       lpDecimals &&
  //       stakingEndSec
  //     )
  //   )
  //     return Big('0');

  //   const n = Big(depositAmount).div(10 ** lpDecimals);
  //   if (isZero(n)) return Big('0');

  //   const r = Big(2592e3);
  //   const t = {
  //     totalStakingShares,
  //     totalStaked: totalStaked.div(10 ** lpDecimals),
  //     totalStakingShareSeconds,
  //   };
  //   const e = {
  //     totalStakedFor: totalStakedFor.div(10 ** lpDecimals),
  //     userStakingShareSeconds,
  //   };
  //   const i = e.totalStakedFor.mul(t.totalStakingShares).div(t.totalStaked);
  //   const o = n.mul(t.totalStakingShares).div(t.totalStaked);
  //   const a1 = e.userStakingShareSeconds.add(i.add(o).mul(r));
  //   const a2 = t.totalStakingShareSeconds.add(
  //     t.totalStakingShares.add(o).mul(r)
  //   );
  //   const a = a1.div(a2);

  //   // console.log(
  //   //   Object.entries({
  //   //     totalStakingShares: t.totalStakingShares,
  //   //     totalStaked: t.totalStaked,
  //   //     totalStakingShareSeconds: t.totalStakingShareSeconds,
  //   //     totalStakedFor: e.totalStakedFor,
  //   //     userStakingShareSeconds: e.userStakingShareSeconds,
  //   //   }).reduce((r, [k, v]) => {
  //   //     r[k] = v.toString();
  //   //     return r;
  //   //   }, {})
  //   // );
  //   // console.log(n.toString(), a.toString(), monthlyUnlockRate.toString());

  //   let estimate = a.mul(monthlyUnlockRate).div(100);
  //   if (moment.utc().isAfter(moment.unix(stakingEndSec))) {
  //     estimate = estimate.mul(stakingEndSec).div(r);
  //   }
  //   return estimate;
  // }, [
  //   depositAmount,
  //   monthlyUnlockRate,
  //   totalStakingShares,
  //   totalStaked,
  //   totalStakingShareSeconds,
  //   totalStakedFor,
  //   userStakingShareSeconds,
  //   lpDecimals,
  //   stakingEndSec,
  // ]);

  const onSetDepositAmount = event => {
    setDepositMaxAmount(false);
    setInputAmount(event.target.value);
  };

  const onSetDepositMaxAmount = async () => {
    if (!(lpContract && address)) return;
    const depositAmount = await lpContract.balanceOf(address);
    if (isZero(depositAmount)) return;
    setInputAmount(formatUnits(depositAmount, lpDecimals, 18));
    setDepositMaxAmount(true);
    setMaxDepositAmount(depositAmount);
  };

  React.useEffect(() => {
    checkAllowance();
  }, [lpContract, address, depositAmount]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    onSetDepositMaxAmount();
  }, [lpContract, address]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {!lpName ? null : (
        <div className={'flex'}>
          <TextField
            id="amount"
            value={inputAmount}
            label={
              <div className="flex flex-grow justify-space">
                <div className="flex-grow">Deposit Amount ({lpName})</div>
                <div>
                  <Balance header="Available" tokenAddress={lpAddress} />
                </div>
              </div>
            }
            type="number"
            step="any"
            className={classes.input}
            InputLabelProps={{
              shrink: true,
            }}
            fullWidth
            onChange={onSetDepositAmount}
          />

          <Box className="flex items-end" pl={2}>
            <Button
              color="default"
              variant="outlined"
              onClick={onSetDepositMaxAmount}
              disabled={!(lpContract && address)}
              className={classes.maxButton}
            >
              MAX
            </Button>
          </Box>
        </div>
      )}

      {/* <Box mt={2}>
        <Paper className={clsx(classes.rewards)}>
          <div>Your Estimated Rewards:</div>
          <div>{toFixed(monthlyDittoRewards, 1)} DITTO / month,</div>
          <div>plus CAKE depending on Pancakeswap emission.</div>
        </Paper>
      </Box> */}

      <Box mt={2}>
        <Button
          color="secondary"
          variant="contained"
          disabled={isDepositing || isApproving}
          onClick={onConnectOrApproveOrDeposit}
          className={classes.depositButton}
        >
          {isDepositing
            ? 'Depositing...'
            : isApproving
            ? 'Approving...'
            : !signer
            ? 'Connect Wallet'
            : !isApproved
            ? 'Approve'
            : 'Deposit'}
        </Button>
      </Box>
    </>
  );
}
