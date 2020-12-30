import React from 'react';
import * as ethers from 'ethers';
import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import { Box, Paper } from '@material-ui/core';
import { BORDER_RADIUS } from 'config';
import { formatUnits, toFixed } from 'utils/big-number';
import { useWallet } from 'contexts/wallet';

const useStyles = makeStyles(theme => ({
  container: {
    paddingTop: 14,
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
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
  },
}));

export default function() {
  const classes = useStyles();

  const { address, stakingContract, dittoDecimals, cakeDecimals } = useWallet();

  const [apy, setAPY] = React.useState(ethers.BigNumber.from('0'));
  const [rewardMultiplier, setRewardMultiplier] = React.useState(
    ethers.BigNumber.from('1')
  );
  const [availableDittoRewards, setAvailableDittoRewards] = React.useState(
    ethers.BigNumber.from('0')
  );
  const [availableCakeRewards, setAvailableCakeRewards] = React.useState(
    ethers.BigNumber.from('0')
  );

  const loadStats = async () => {
    if (!(stakingContract && address)) return;
    const [availableCakeRewards] = await Promise.all([
      stakingContract.pendingCakeByUser(address),
    ]);
    setAvailableCakeRewards(availableCakeRewards);
    setAvailableDittoRewards(availableCakeRewards);

    setAPY(ethers.BigNumber.from('35484'));
    setRewardMultiplier(ethers.BigNumber.from('1'));
  };

  const stats = React.useMemo(
    () => [
      {
        name: 'APY',
        value: [`${toFixed(apy, 100, 2)}%`],
      },
      {
        name: 'Reward Multiplier',
        value: [`${toFixed(rewardMultiplier, 1, 1)}x`],
      },
      {
        name: 'Rewards Earned',
        value: [
          `${formatUnits(availableDittoRewards, dittoDecimals)} DITT0`,
          `${formatUnits(availableCakeRewards, cakeDecimals)} CAKE`,
        ],
      },
    ],
    [
      apy,
      rewardMultiplier,
      availableDittoRewards,
      availableCakeRewards,
      dittoDecimals,
      cakeDecimals,
    ]
  );

  React.useEffect(() => {
    loadStats();
  }, [stakingContract]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Box className={clsx(classes.container)}>
      {stats.map(s => (
        <StatBox key={s.name} {...s} />
      ))}
    </Box>
  );
}

function StatBox({ name, value }) {
  const classes = useStyles();

  return (
    <Paper className={clsx(classes.box)}>
      <div>{name}</div>
      <div>
        {value.map((v, i) => (
          <div key={i}>{v}</div>
        ))}
      </div>
    </Paper>
  );
}
