import React from 'react';
import * as ethers from 'ethers';
import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import { Box, Paper } from '@material-ui/core';
import { BORDER_RADIUS } from 'config';
import { formatUnits, toFixed } from 'utils/big-number';
import { useWallet } from 'contexts/wallet';
import { useStats } from 'contexts/stats';

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
  const { apy } = useStats();

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
  };

  React.useEffect(() => {
    loadStats();
  }, [stakingContract, address]); // eslint-disable-line react-hooks/exhaustive-deps

  const stats = React.useMemo(
    () => [
      {
        name: 'APY',
        value: [`${toFixed(apy, 100, 2)}%`],
      },
      {
        name: 'Reward Multiplier',
        value: ['1.0x'],
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
      },
    ],
    [
      apy,
      availableDittoRewards,
      availableCakeRewards,
      dittoDecimals,
      cakeDecimals,
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
