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
import * as request from 'utils/request';

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
  const [claimInfo, setClaimInfo] = React.useState({});
  const [isClaimed, setIsClaimed] = React.useState(false);
  const { address } = useWallet();
  const { tx } = useNotifications();

  const canClaim = React.useMemo(() => {
    return claimInfo.index !== undefined;
  }, [claimInfo.index]);

  const didClaim = React.useMemo(() => {
    return canClaim && isClaimed;
  }, [canClaim, isClaimed]);

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

  React.useEffect(() => {
    if (!(contract && address)) return;

    let isMounted = true;
    const unsubs = [() => (isMounted = false)];

    const load = async () => {
      const claimInfo = await request.api(`/claim-info/${date}/${address}`);
      if (isMounted) setClaimInfo(claimInfo ?? {});
    };

    load();
    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [contract, address, date]);

  React.useEffect(() => {
    if (!(contract && canClaim)) return;

    let isMounted = true;
    const unsubs = [() => (isMounted = false)];

    const load = async () => {
      const isClaimed = await contract.isClaimed(claimInfo.index);
      if (isMounted) {
        setIsClaimed(isClaimed);
      }
    };

    load();
    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [contract, canClaim, claimInfo.index]);

  return (
    <TableRow className={classes.rowx}>
      <TableCell component="th" scope="row">
        {date}
      </TableCell>
      <TableCell>
        {canClaim ? formatUnits(parseInt(claimInfo.amount, 16), 18) : 0} BNB
      </TableCell>
      <TableCell align="right">
        <Button
          color="secondary"
          variant="outlined"
          onClick={claim}
          disabled={!!isWorking || didClaim}
        >
          {isWorking ? isWorking : didClaim ? 'CLAIMED' : 'CLAIM'}
        </Button>
      </TableCell>
    </TableRow>
  );
}
