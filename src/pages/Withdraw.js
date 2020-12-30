import React from 'react';
import * as ethers from 'ethers';
import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import { Box, Paper, Button, TextField } from '@material-ui/core';
import { STAKING_ADDRESS, useWallet } from 'contexts/wallet';
import { useNotifications } from 'contexts/notifications';
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
  stats: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    columnGap: '10px',
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
  } = useWallet();

  const [isApproving, setIsApproving] = React.useState(false);
  const [isApproved, setIsApproved] = React.useState(false);
  const [isUnstaking, setIsUnstaking] = React.useState(false);

  const [monthlyDittoRewards] = React.useState(ethers.BigNumber.from('0'));
  const [monthlyCakeRewards] = React.useState(ethers.BigNumber.from('0'));

  const [totalStakedFor, setTotalStakedFor] = React.useState(
    ethers.BigNumber.from('0')
  );

  const { showTxNotification, showErrorNotification } = useNotifications();
  const [amountInput, setAmountInput] = React.useState(0);
  const [stakeMaxAmount, setUnstakeMaxAmount] = React.useState(false);
  const amount = React.useMemo(() => {
    try {
      return ethers.utils.parseUnits(amountInput.toString(), lpDecimals);
    } catch {
      return ethers.BigNumber.from('0');
    }
  }, [amountInput, lpDecimals]);

  const onConnectOrApproveOrUnstake = async () => {
    if (!signer) {
      return startConnectingWallet();
    }
    !isApproved ? approve() : unstake();
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

  const unstake = async () => {
    try {
      setIsUnstaking(true);
      const tx = await stakingContract.stake(
        stakeMaxAmount ? await lpContract.balanceOf(address) : amount,
        EMPTY_CALL_DATA
      );
      showTxNotification(`Unstaking ${lpName}`, tx.hash);
      await tx.wait();
      showTxNotification(`Unstaked ${lpName}`, tx.hash);
      await onSetUnstakeMaxAmount();
    } catch (e) {
      showErrorNotification(e);
    } finally {
      setIsUnstaking(false);
    }
  };

  const checkCollateralAllowance = async () => {
    if (!(lpContract && address)) return setIsApproved(true);
    const allowance = await lpContract.allowance(address, STAKING_ADDRESS);
    setIsApproved(allowance.gte(amount));
  };

  const onSetUnstakeAmount = e => {
    setUnstakeMaxAmount(false);
    setAmountInput(e.target.value || 0);
  };

  const onSetUnstakeMaxAmount = async () => {
    if (!(stakingContract && address)) return;
    const totalStakedFor = await stakingContract.totalStakedFor(address);
    setTotalStakedFor(totalStakedFor);
    setAmountInput(formatUnits(totalStakedFor, 18));
    setUnstakeMaxAmount(true);
  };

  React.useEffect(() => {
    onSetUnstakeMaxAmount();
  }, [stakingContract, address]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    checkCollateralAllowance();
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
                <div className="flex-grow">Unstake Amount ({lpName})</div>
                <div>
                  Deposited: {formatUnits(totalStakedFor, 18)} {lpName}
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
            onChange={onSetUnstakeAmount}
          />

          <Box className="flex items-end" pl={2}>
            <Button
              color="default"
              variant="outlined"
              onClick={onSetUnstakeMaxAmount}
              disabled={!(lpContract && address)}
              className={classes.maxButton}
            >
              MAX
            </Button>
          </Box>
        </div>
      )}

      <Box mt={2} className={classes.stats}>
        <Paper className={clsx(classes.rewards)}>
          <div>Amount to Withdraw:</div>
          <div>
            {formatUnits(totalStakedFor, 18)} {lpName}
          </div>
        </Paper>

        <Paper className={clsx(classes.rewards)}>
          <div>Rewards Claimed:</div>
          <div>{formatUnits(monthlyDittoRewards, 18)} DITTO</div>
          <div>{formatUnits(monthlyCakeRewards, 18)} CAKE</div>
        </Paper>
      </Box>

      <Box mt={2}>
        <Button
          color="secondary"
          variant="contained"
          disabled={isUnstaking || isApproving}
          onClick={onConnectOrApproveOrUnstake}
          className={classes.stakeButton}
        >
          {isUnstaking
            ? 'Unstaking...'
            : isApproving
            ? 'Approving...'
            : !signer
            ? 'Connect Wallet'
            : !isApproved
            ? 'Approve'
            : 'Withdraw'}
        </Button>
      </Box>
    </div>
  );
}
