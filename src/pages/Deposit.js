import React from 'react';
import * as ethers from 'ethers';
import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import { Box, Paper, Button, TextField } from '@material-ui/core';
import { STAKING_ADDRESS, useWallet } from 'contexts/wallet';
import { useNotifications } from 'contexts/notifications';
import Balance from 'components/Balance';
import { formatUnits } from 'utils/big-number';
import { BORDER_RADIUS, EMPTY_CALL_DATA } from 'config';

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
  stakeButton: {
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

export default function() {
  const classes = useStyles();

  const {
    startConnecting: startConnectingWallet,
    signer,
    address,
    stakingContract,
    lpContract,
    lpDecimals,
    lpName,
    dittoAddress,
  } = useWallet();

  const [isApproving, setIsApproving] = React.useState(false);
  const [isApproved, setIsApproved] = React.useState(false);
  const [isStaking, setIsStaking] = React.useState(false);

  const [monthlyDittoRewards] = React.useState(ethers.BigNumber.from('0'));
  const [monthlyCakeRewards] = React.useState(ethers.BigNumber.from('0'));

  const { showTxNotification, showErrorNotification } = useNotifications();
  const [amountInput, setAmountInput] = React.useState(0);
  const [stakeMaxAmount, setStakeMaxAmount] = React.useState(false);
  const amount = React.useMemo(() => {
    try {
      return ethers.utils.parseUnits(amountInput.toString(), lpDecimals);
    } catch {
      return ethers.BigNumber.from('0');
    }
  }, [amountInput, lpDecimals]);

  const onConnectOrApproveOrStake = async () => {
    if (!signer) {
      return startConnectingWallet();
    }
    !isApproved ? approve() : stake();
  };

  const approve = async () => {
    try {
      setIsApproving(true);
      const tx = await lpContract.approve(STAKING_ADDRESS, amount);
      showTxNotification(`Approving ${lpName}`, tx.hash);
      await tx.wait();
      showTxNotification(`Approved ${lpName}`, tx.hash);
      await checkCollateralAllowance();
    } catch (e) {
      showErrorNotification(e);
    } finally {
      setIsApproving(false);
    }
  };

  const stake = async () => {
    try {
      setIsStaking(true);
      const tx = await stakingContract.stake(
        stakeMaxAmount ? await lpContract.balanceOf(address) : amount,
        EMPTY_CALL_DATA
      );
      showTxNotification(`Staking ${lpName}`, tx.hash);
      await tx.wait();
      showTxNotification(`Staked ${lpName}`, tx.hash);
    } catch (e) {
      showErrorNotification(e);
    } finally {
      setIsStaking(false);
    }
  };

  const checkCollateralAllowance = async () => {
    if (!(lpContract && address)) return setIsApproved(true);
    const allowance = await lpContract.allowance(address, STAKING_ADDRESS);
    setIsApproved(allowance.gte(amount));
  };

  const onSetStakeAmount = e => {
    setStakeMaxAmount(false);
    setAmountInput(e.target.value || 0);
  };

  const onSetStakeMaxAmount = async () => {
    if (!(lpContract && address)) return;
    setAmountInput(
      formatUnits(await lpContract.balanceOf(address), lpDecimals)
    );
    setStakeMaxAmount(true);
  };

  React.useEffect(() => {
    checkCollateralAllowance();
    onSetStakeMaxAmount();
  }, [lpContract, address]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={classes.container}>
      {!lpName ? null : (
        <div className={'flex'}>
          <TextField
            id="amount"
            value={amountInput}
            label={
              <div className="flex flex-grow justify-space">
                <div className="flex-grow">Stake Amount ({lpName})</div>
                <div>
                  <Balance header="Available" tokenAddress={dittoAddress} />
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
            onChange={onSetStakeAmount}
          />

          <Box className="flex items-end" pl={2}>
            <Button
              color="default"
              variant="outlined"
              onClick={onSetStakeMaxAmount}
              disabled={!(lpContract && address)}
              className={classes.maxButton}
            >
              MAX
            </Button>
          </Box>
        </div>
      )}

      {!(lpName && dittoAddress) ? null : (
        <Box mt={2}>
          Get {lpName} by adding liquidity to the DITTO-BNB pool over{' '}
          <a
            href={`https://exchange.pancakeswap.finance/#/add/ETH/${dittoAddress}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            here
          </a>
          .
        </Box>
      )}

      <Box mt={2}>
        <Paper className={clsx(classes.rewards)}>
          <div>Your Estimated Rewards:</div>
          <div>{formatUnits(monthlyDittoRewards, 18)} DITTO / month</div>
          <div>{formatUnits(monthlyCakeRewards, 18)} CAKE / month</div>
        </Paper>
      </Box>

      <Box mt={2}>
        <Button
          color="secondary"
          variant="contained"
          disabled={isStaking || isApproving}
          onClick={onConnectOrApproveOrStake}
          className={classes.stakeButton}
        >
          {isStaking
            ? 'Staking...'
            : isApproving
            ? 'Approving...'
            : !signer
            ? 'Connect Wallet'
            : !isApproved
            ? 'Approve'
            : 'Deposit'}
        </Button>
      </Box>
    </div>
  );
}
