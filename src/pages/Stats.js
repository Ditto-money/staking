import React from 'react';
import clsx from 'clsx';
import moment from 'moment';
import { makeStyles } from '@material-ui/core/styles';
import { Box, Paper } from '@material-ui/core';
import { BORDER_RADIUS } from 'config';
import { toFixed } from 'utils/big-number';
import { useStats } from 'contexts/stats';

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

  const { totalDeposits, stakingEndSec } = useStats();

  const stats = React.useMemo(
    () => [
      {
        name: 'Total Deposits',
        value: [`${toFixed(totalDeposits, 1, 2)} USD`],
      },

      {
        name: 'Program duration',
        value: [<Countdown to={stakingEndSec} />],
      },
    ],
    [totalDeposits, stakingEndSec]
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

function Countdown({ to }) {
  const [duration, setDuration] = React.useState('-');

  React.useEffect(() => {
    if (!to) return;
    const id = setInterval(() => {
      setDuration(`${moment.unix(to).from(moment.utc(), true)} left`);
    }, 1000);
    return () => {
      clearInterval(id);
    };
  }, [to]);

  return <div>{duration}</div>;
}
