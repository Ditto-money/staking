import React from 'react';
import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import * as ethers from 'ethers';
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
import DROP_ABI from 'abis/merkle.json';
import { NETWORK } from 'config';

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
  const { signer } = useWallet();

  const drops = React.useMemo(() => {
    if (!signer) return [];
    return Array.from(NETWORK.drops.entries()).map(([address, date]) => ({
      address,
      date,
      contract: new ethers.Contract(address, DROP_ABI, signer),
    }));
  }, [signer]);

  const close = () => history.push('/');

  return (
    <Dialog onClose={close} aria-labelledby="bonus" open={true}>
      <div className={clsx('flex', 'flex-grow', 'flex-col', classes.container)}>
        <>
          <div className={classes.x}>
            <Icon style={{ fontSize: 20 }} onClick={close} />
          </div>
          <h3>Claim Bonusses</h3>

          <Table className={classes.tablex} aria-label="Bonus">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell align="right"></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {drops.map(({ date, contract }) => (
                <Drop key={date} {...{ date, contract }} />
              ))}
            </TableBody>
          </Table>
        </>
      </div>
    </Dialog>
  );
}

function Drop({ date, contract }) {
  const classes = useStyles();

  const [isWorking, setIsWorking] = React.useState(null);
  const { address } = useWallet();
  const { tx } = useNotifications();

  const claim = async () => {
    try {
      setIsWorking('Claiming...');
      tx('Claiming...', 'Claimed!', await contract.claim(address));
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <TableRow className={classes.rowx}>
      <TableCell component="th" scope="row">
        {date}
      </TableCell>
      <TableCell>{formatUnits(10, 18)} BNB</TableCell>
      <TableCell align="right">
        <Button
          color="secondary"
          variant="outlined"
          onClick={claim}
          disabled={isWorking}
        >
          {isWorking ? isWorking : 'CLAIM'}
        </Button>
      </TableCell>
    </TableRow>
  );
}
