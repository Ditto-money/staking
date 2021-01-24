import React from 'react';
import clsx from 'clsx';
import moment from 'moment';
import { Link } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import { Box, Tooltip } from '@material-ui/core';
import { Help as TipIcon } from '@material-ui/icons';
import { formatUnits, toFixed, isZero } from 'utils/big-number';
import Paper from 'components/Paper';
import { useWallet } from 'contexts/wallet';
import { useStats } from 'contexts/stats';

const useStyles = makeStyles(theme => ({
  container: {
    paddingTop: 14,
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr',
    columnGap: '10px',
  },
  box: {
    display: 'flex',
    flexGrow: 1,
    flexDirection: 'column',
    padding: 20,
    background: theme.palette.isDark ? '#555' : '#fff',
    color: theme.palette.isDark ? 'white' : '#373836',
    position: 'relative',
  },
  boxTip: {
    position: 'absolute',
    top: 5,
    right: 5,
  },
  boxTitle: {
    fontSize: 11,
  },
  small: {
    fontSize: 10,
  },
  link: {
    color: theme.palette.primary.main,
    textDecoration: 'none',
  },
}));

export default function() {
  const classes = useStyles();
  const { dittoDecimals, cakeDecimals, wrappedBNBDecimals } = useWallet();
  const {
    apy,
    availableDittoRewards,
    availableCakeRewards,
    rewardMultiplier,
    bnbPonusPoolSharePercentage,
    bnbPonusPoolShareAmount,
    stakingEndSec,
  } = useStats();

  const stats = React.useMemo(
    () => [
      {
        name: 'APY',
        value: [`${toFixed(apy, 1, 2)}%`],
        tip: 'APY is estimated for a new deposit over the next 30 days.',
      },
      {
        name: 'Reward Multiplier',
        value: [`${toFixed(rewardMultiplier, 1, 1)}x`],
        tip:
          'Deposit liquidity for 14 days to achieve a 3x reward multiplier. The multiplier applies to DITTO rewards only.',
      },
      {
        name: 'Rewards Earned',
        value: [
          <div className="flex items-center">
            {formatUnits(availableDittoRewards, dittoDecimals)} DITT0
            <Box ml={1} className="flex items-center">
              <img src="coins/DITTO.png" alt="DITTO" width={15} height={15} />
            </Box>
          </div>,
          <div className="flex items-center">
            {formatUnits(availableCakeRewards, cakeDecimals)} CAKE&nbsp;
            <Box ml={1} className="flex items-center">
              <img src="coins/CAKE.png" alt="CAKE" width={15} height={15} />
            </Box>
          </div>,
        ],
        tip:
          'Amount of DITTO and CAKE rewards you will receive on unstaking. Note that unstaking resets your multiplier.',
      },
      {
        name: 'Projected Bonus Share',
        value: [
          <div className="flex items-center">
            {toFixed(bnbPonusPoolSharePercentage, 0.01, 2)} %
          </div>,
          <Link to="/bonus" className={clsx('flex items-center', classes.link)}>
            {formatUnits(bnbPonusPoolShareAmount, wrappedBNBDecimals)} BNB&nbsp;
            <Box ml={1} className="flex items-center">
              <img src="coins/BNB.png" alt="BNB" width={15} height={15} />
            </Box>
          </Link>,
          <div>
            {isZero(stakingEndSec) ? null : (
              <div className={classes.small}>
                To receive this reward you must stake until{' '}
                {moment
                  .unix(stakingEndSec)
                  .local()
                  .format('MMM D, YYYY')}
                .
              </div>
            )}
          </div>,
        ],
        tip:
          'Amount of bonus pool tokens earned. To claim this bonus you must stake until the end of this staking program. The larger your deposit and the longer you stake, the more bonus shares you will accumulate.',
      },
    ],
    [
      apy,
      availableDittoRewards,
      availableCakeRewards,
      dittoDecimals,
      cakeDecimals,
      wrappedBNBDecimals,
      rewardMultiplier,
      bnbPonusPoolShareAmount,
      bnbPonusPoolSharePercentage,
      stakingEndSec,
      classes.small,
      classes.link,
    ]
  );

  return (
    <Box className={clsx(classes.container)}>
      {stats.map(s => (
        <StatBox key={s.name} {...s} />
      ))}
    </Box>
  );
}

function StatBox({ name, value, tip }) {
  const classes = useStyles();

  return (
    <Paper className={clsx(classes.box)}>
      <Tooltip title={tip}>
        <TipIcon style={{ fontSize: 15 }} className={classes.boxTip} />
      </Tooltip>
      <div className={clsx(classes.boxTitle)}>{name}</div>
      <div>
        {value.map((v, i) => (
          <div key={i}>{v}</div>
        ))}
      </div>
    </Paper>
  );
}
