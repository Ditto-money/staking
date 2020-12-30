import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Paper } from '@material-ui/core';
import { Router, Route, Switch, Redirect } from 'react-router-dom';
import { createBrowserHistory } from 'history';
import { BORDER_RADIUS } from 'config';
import Header from './Header';
import TopStats from './TopStats';
import Nav from './Nav';
import Withdraw from './Withdraw';
import Deposit from './Deposit';
import Stats from './Stats';
import ConnectWallet from './ConnectWallet';

const history = createBrowserHistory();

const useStyles = makeStyles(theme => ({
  container: {
    width: '960px',
    margin: '0 auto',
    padding: '100px 0 30px',
    position: 'relative',
    [theme.breakpoints.down('sm')]: {
      padding: '70px 0 10px',
      width: 'auto',
    },
  },
  paper: {
    borderRadius: BORDER_RADIUS,
  },
  tabContent: {
    padding: 20,
  },
}));

export default function App() {
  const classes = useStyles();

  return (
    <div className={classes.container}>
      <Router {...{ history }}>
        <Header />
        <TopStats />
        <Paper className={classes.paper}>
          <Nav />
          <div className={classes.tabContent}>
            <Switch>
              <Route path={'/deposit'} component={Deposit} />
              <Route path={'/withdraw'} component={Withdraw} />
              <Route path={'/stats'} component={Stats} />
              <Redirect to={'/stats'} />
            </Switch>
          </div>
        </Paper>
        <ConnectWallet />
      </Router>
    </div>
  );
}
