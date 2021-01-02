import React from 'react';
import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import { Box, Paper, Tooltip } from '@material-ui/core';
import { Help as TipIcon } from '@material-ui/icons';
import { BORDER_RADIUS } from 'config';
import { formatUnits, toFixed } from 'utils/big-number';
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
    justifyContent: 'center',
    padding: 20,
    borderRadius: BORDER_RADIUS,
    background: '#555',
    color: 'white',
    position: 'relative',
  },
  boxTip: {
    position: 'absolute',
    top: 5,
    right: 5,
  },
}));

export default function() {
  const classes = useStyles();
  const { dittoDecimals, cakeDecimals } = useWallet();
  const {
    apy,
    availableDittoRewards,
    availableCakeRewards,
    rewardMultiplier,
  } = useStats();

  const stats = React.useMemo(
    () => [
      {
        name: 'APY',
        value: [`${toFixed(apy, 1, 2)}%`],
        tip:
          'APY is estimated for a new deposit over the next 30 days. The APY metric does not account for gains or losses from holding liquidity tokens, or gains from liquidity mining rewards distributed by the underlying plarform for holding liquidity tokens.',
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
        name: 'Bonus pool share',
        value: [
          <div className="flex items-center">
            - BNB&nbsp;
            <Box ml={1} className="flex items-center">
              <img src="coins/BNB.png" alt="BNB" width={15} height={15} />
            </Box>
          </div>,
          <div className="flex items-center">
            COMING SOON{' '}
            {/*To receive this bonus amount, you must stake until the end of the program.*/}
          </div>,
        ],
        tip:
          'Amount of bonus pool tokens earned. To claim this bonus you must stake until the end of this staking program. You The larger your deposit and the longer you stake, the more bonus shares you will accumulate.',
      },
    ],
    [
      apy,
      availableDittoRewards,
      availableCakeRewards,
      dittoDecimals,
      cakeDecimals,
      rewardMultiplier,
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
      <div>{name}</div>
      <div>
        {value.map((v, i) => (
          <div key={i}>{v}</div>
        ))}
      </div>
    </Paper>
  );
}
