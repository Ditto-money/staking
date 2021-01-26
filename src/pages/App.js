import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Paper, Box } from '@material-ui/core';
import {
  HashRouter as Router,
  Route,
  Switch,
  Redirect,
} from 'react-router-dom';
import { BORDER_RADIUS, ROUTER_BASE_NAME } from 'config';
import Header from './Header';
import TopStats from './TopStats';
import Nav from './Nav';
import Withdraw from './Withdraw';
import Deposit from './Deposit';
import Stats from './Stats';
import Bonus from './Bonus';
import ConnectWallet from './ConnectWallet';

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
  betaMoved: {
    color: theme.palette.isDark ? '#aaa' : '#777',
  },
  betaMovedHere: {
    color: theme.palette.isDark ? '#ddd' : '#888',
  },
}));

export default function App() {
  const classes = useStyles();

  return (
    <Box className={classes.container}>
      <Router basename={ROUTER_BASE_NAME}>
        <Header />
        <TopStats />
        <Paper className={classes.paper}>
          <Nav />
          <Box className={classes.tabContent}>
            <Switch>
              <Route path={'/deposit'} component={Deposit} />
              <Route exact path={'/withdraw'} component={Withdraw} />
              <Route exact path={'/stats'} component={Stats} />
              <Route exact path={'/bonus'} component={Bonus} />
              <Redirect to={'/deposit'} />
            </Switch>
          </Box>
        </Paper>
        <ConnectWallet />
      </Router>
    </Box>
  );
}
