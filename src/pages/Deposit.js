import React from 'react';
import * as ethers from 'ethers';
import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import { withRouter, Switch, Route, Redirect } from 'react-router-dom';
import {
  Box,
  Paper,
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
import { formatUnits } from 'utils/big-number';
import { BORDER_RADIUS, EMPTY_CALL_DATA } from 'config';
import ERC20_CONTRACT_ABI from 'abis/erc20.json';
import sleep from 'utils/sleep';

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
            You have {formatUnits(balance, lpDecimals)} {lpName} Tokens.
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

  const [isApproving, setIsApproving] = React.useState(false);
  const [isApproved, setIsApproved] = React.useState(false);
  const [isDepositing, setIsDepositing] = React.useState(false);

  const [monthlyDittoRewards] = React.useState(ethers.BigNumber.from('0'));
  // const [monthlyCakeRewards] = React.useState(ethers.BigNumber.from('0'));

  const { showTxNotification, showErrorNotification } = useNotifications();
  const [amountInput, setAmountInput] = React.useState(0);
  const [depositMaxAmount, setDepositMaxAmount] = React.useState(false);
  const amount = React.useMemo(() => {
    try {
      return ethers.utils.parseUnits(amountInput.toString(), lpDecimals);
    } catch {
      return ethers.BigNumber.from('0');
    }
  }, [amountInput, lpDecimals]);

  const onConnectOrApproveOrDeposit = async () => {
    if (!signer) {
      return startConnectingWallet();
    }
    !isApproved ? approve() : deposit();
  };

  const approve = async () => {
    try {
      setIsApproving(true);
      const tx = await lpContract.approve(STAKING_ADDRESS, amount);
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
      const maxDepositAmount = await lpContract.balanceOf(address);
      const depositAmount = depositMaxAmount ? maxDepositAmount : amount;
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
    if (!(lpContract && address && amount)) return setIsApproved(true);
    const allowance = await lpContract.allowance(address, STAKING_ADDRESS);
    setIsApproved(allowance.gte(amount));
  };

  const onSetDepositAmount = e => {
    setDepositMaxAmount(false);
    setAmountInput(e.target.value);
  };

  const onSetDepositMaxAmount = async () => {
    if (!(lpContract && address)) return;
    setAmountInput(
      formatUnits(await lpContract.balanceOf(address), lpDecimals)
    );
    setDepositMaxAmount(true);
  };

  React.useEffect(() => {
    checkAllowance();
  }, [lpContract, address, amount]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    onSetDepositMaxAmount();
  }, [lpContract, address]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {!lpName ? null : (
        <div className={'flex'}>
          <TextField
            id="amount"
            value={amountInput}
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

      <Box mt={2}>
        <Paper className={clsx(classes.rewards)}>
          <div>Your Estimated Rewards:</div>
          <div>{formatUnits(monthlyDittoRewards, 18)} DITTO / month plus,</div>
          <div>CAKE depending on Pancakeswap emission.</div>
        </Paper>
      </Box>

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
