import React from 'react';
import * as ethers from 'ethers';
import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import { Box, Paper } from '@material-ui/core';
import { BORDER_RADIUS } from 'config';
import { toFixed } from 'utils/big-number';
import { useWallet } from 'contexts/wallet';

const useStyles = makeStyles(theme => ({
  container: {
    display: 'grid',
    gridTemplateRows: '1fr 1fr 1fr',
    gridTemplateColumns: '1fr 1fr',
    columnGap: '10px',
    rowGap: '10px',
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

  const { stakingContract } = useWallet();

  const [totalDeposits, setTotalDeposits] = React.useState(
    ethers.BigNumber.from('1')
  );
  const [programDuration, setProgramDuration] = React.useState(
    ethers.BigNumber.from('0')
  );
  const loadStats = async () => {
    if (!stakingContract) return;
    const [totalLocked, bonusPeriodSec] = await Promise.all([
      stakingContract.totalLocked(),
      stakingContract.bonusPeriodSec(),
    ]);
    setTotalDeposits(totalLocked);
    setProgramDuration(bonusPeriodSec);
  };

  const stats = React.useMemo(
    () => [
      {
        name: 'Total Deposits',
        value: [`${toFixed(totalDeposits, 1, 2)} USD`],
      },

      {
        name: 'Program duration',
        value: [`${toFixed(programDuration, 60, 2)} days left`],
      },
    ],
    [totalDeposits, programDuration]
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
