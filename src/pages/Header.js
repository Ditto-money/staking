import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Link } from 'react-router-dom';
import { AppBar, Typography, Toolbar, Button } from '@material-ui/core';
import { APP_TITLE } from 'config';
import { useWallet } from 'contexts/wallet';

const useStyles = makeStyles(theme => ({
  container: {},
  title: {
    color: theme.palette.primary.main,
    textDecoration: 'none',
  },
  account: {
    marginRight: 10,
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
  },
}));

export default function Component() {
  const classes = useStyles();
  const { address, startConnecting, disconnect } = useWallet();

  const shortAddress =
    address && `${address.slice(0, 6)}....${address.slice(-4)}`;

  return (
    <AppBar position="fixed" color="inherit" className={classes.container}>
      <Toolbar color="inherit">
        <Typography variant="h6" className={'flex flex-grow'}>
          <div className={'flex flex-col'} href="/">
            <Link to="/" className={classes.title}>
              {APP_TITLE}
            </Link>
          </div>
        </Typography>

        {address ? (
          <>
            &nbsp;
            <div className={classes.account}>{shortAddress}</div>
            <Button color="secondary" onClick={disconnect}>
              Disconnect
            </Button>
          </>
        ) : (
          <Button color="secondary" onClick={startConnecting}>
            Connect Wallet
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
}
