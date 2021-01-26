import React from 'react';
import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import {
  Dialog,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
} from '@material-ui/core';
import { Close as Icon } from '@material-ui/icons';
import { formatUnits } from 'utils/big-number';
import { useNotifications } from 'contexts/notifications';
import { useWallet } from 'contexts/wallet';
import Loader from 'components/Loader';
import { useBonuses } from 'contexts/bonuses';

const useStyles = makeStyles(theme => ({
  container: {
    width: 500,
    height: 400,
    padding: '0 20px 10px',
    lineHeight: '1.5rem',
  },
  x: {
    position: 'absolute',
    top: 5,
    right: 5,
    cursor: 'pointer',
  },
}));

export default function({ history }) {
  const classes = useStyles();
  const { drops, isLoaded } = useBonuses();

  const close = () => history.push('/');

  return (
    <Dialog onClose={close} aria-labelledby="bonus" open={true}>
      <div className={clsx('flex', 'flex-grow', 'flex-col', classes.container)}>
        <>
          <div className={classes.x}>
            <Icon style={{ fontSize: 20 }} onClick={close} />
          </div>
          <h3>Claim Bonuses</h3>

          {!isLoaded ? (
            <Loader />
          ) : (
            <Table className={classes.tablex} aria-label="Bonus">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell align="right"></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {drops.map(drop => (
                  <Drop key={drop.date} {...drop} />
                ))}
              </TableBody>
            </Table>
          )}
        </>
      </div>
    </Dialog>
  );
}

function Drop({ date, canClaim, didClaim, contract, claimInfo }) {
  const classes = useStyles();
  const [isWorking, setIsWorking] = React.useState(null);
  const { address } = useWallet();
  const { tx } = useNotifications();

  const claim = async () => {
    setIsWorking('Claiming...');
    try {
      await tx('Claiming...', 'Claimed!', () =>
        contract.claim(
          claimInfo.index,
          address,
          claimInfo.amount,
          claimInfo.proof
        )
      );
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <TableRow className={classes.rowx}>
      <TableCell component="th" scope="row">
        {date}
      </TableCell>
      <TableCell>
        {canClaim ? formatUnits(parseInt(Number(claimInfo.amount), 10), 18) : 0}{' '}
        BNB
      </TableCell>
      <TableCell align="right">
        <Button
          color="secondary"
          variant="outlined"
          onClick={claim}
          disabled={!!isWorking || !canClaim || didClaim}
        >
          {isWorking ? isWorking : didClaim ? 'CLAIMED' : 'CLAIM'}
        </Button>
      </TableCell>
    </TableRow>
  );
}
