import React from 'react';
import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import { Link, withRouter } from 'react-router-dom';
import { BORDER_RADIUS } from 'config';

const useStyles = makeStyles(theme => ({
  container: {
    marginTop: 10,
    backgroundColor: theme.palette.isDark ? '#222' : '#eee',
    zIndex: 1,
    borderTopLeftRadius: BORDER_RADIUS,
    borderTopRightRadius: BORDER_RADIUS,
  },
  containerInner: {
    paddingTop: 14,
  },
  link: {
    display: 'flex',
    flexGrow: 1,
    justifyContent: 'center',
    color: theme.palette.isDark ? 'white' : '#373836',
    borderBottom: `5px solid ${theme.palette.isDark ? '#555' : '#ddd'}`,
    textDecoration: 'none',
    padding: '5px 0 15px',
    cursor: 'pointer',
  },
  active: {
    borderBottomColor: theme.palette.secondary.main,
  },
}));

export default withRouter(function() {
  const classes = useStyles();
  const path = window.location.hash;
  const isDeposit = ~path.indexOf('deposit');
  const isWithdraw = ~path.indexOf('withdraw');
  const isStats = ~path.indexOf('stats');

  return (
    <div className={clsx('flex flex-col flex-grow', classes.container)}>
      <div className={clsx('flex flex-grow', classes.containerInner)}>
        <Link
          to="/deposit"
          className={clsx(classes.link, {
            [classes.active]: isDeposit,
          })}
        >
          Deposit
        </Link>
        <Link
          to="/withdraw"
          className={clsx(classes.link, {
            [classes.active]: isWithdraw,
          })}
        >
          Withdraw
        </Link>

        <Link
          to="/stats"
          className={clsx(classes.link, {
            [classes.active]: isStats,
          })}
        >
          Stats
        </Link>
      </div>
    </div>
  );
});
